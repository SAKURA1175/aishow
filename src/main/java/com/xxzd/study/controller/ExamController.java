package com.xxzd.study.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xxzd.study.ai.AiChatService;
import com.xxzd.study.common.ApiResponse;
import com.xxzd.study.domain.*;
import com.xxzd.study.mapper.ExamMapper;
import com.xxzd.study.mapper.WrongQuestionMapper;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    @Resource private ExamMapper mapper;
    @Resource private AiChatService aiChatService;
    @Resource private WrongQuestionMapper wrongQuestionMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ===== CRUD =====

    @PostMapping
    public ApiResponse<?> create(@RequestBody Exam e, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(u.getRole()) && !"admin".equals(u.getRole())) return ApiResponse.fail("仅教师可创建");
        e.setTeacherId(u.getId());
        if (e.getStatus() == null) e.setStatus("draft");
        mapper.insertExam(e);
        return ApiResponse.ok("创建成功", e);
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@PathVariable Long id, @RequestBody Exam e) {
        e.setId(id);
        mapper.updateExam(e);
        return ApiResponse.ok("更新成功");
    }

    @GetMapping("/my")
    public ApiResponse<?> my(HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        if ("teacher".equals(u.getRole()) || "admin".equals(u.getRole()))
            return ApiResponse.ok(mapper.selectByTeacher(u.getId()));
        return ApiResponse.ok(mapper.selectByStudent(u.getId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<?> detail(@PathVariable Long id, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        Map<String, Object> r = new HashMap<>();
        r.put("exam", mapper.selectById(id));

        List<ExamQuestion> questions = mapper.selectQuestions(id);
        boolean isTeacher = "teacher".equals(u.getRole()) || "admin".equals(u.getRole());
        // 学生端隐藏答案
        if (!isTeacher) {
            for (ExamQuestion q : questions) {
                q.setAnswer(null);
            }
        }
        r.put("questions", questions);

        // 如果学生已提交，带上提交记录
        if (!isTeacher) {
            ExamSubmission sub = mapper.selectSubmission(id, u.getId());
            r.put("mySubmission", sub);
        }
        return ApiResponse.ok(r);
    }

    // ===== 题目管理 =====

    @PostMapping("/{id}/question")
    public ApiResponse<?> addQuestion(@PathVariable Long id, @RequestBody ExamQuestion q) {
        q.setExamId(id);
        mapper.insertQuestion(q);
        return ApiResponse.ok("添加成功", q);
    }

    @PutMapping("/question/{qid}")
    public ApiResponse<?> updateQuestion(@PathVariable Long qid, @RequestBody ExamQuestion q) {
        q.setId(qid);
        mapper.updateQuestion(q);
        return ApiResponse.ok("更新成功");
    }

    @DeleteMapping("/question/{qid}")
    public ApiResponse<?> deleteQuestion(@PathVariable Long qid) {
        mapper.deleteQuestion(qid);
        return ApiResponse.ok("删除成功");
    }

    // ===== AI 自动出题（Tool Calling 加速版）=====

    /** 工具定义：create_exam_questions — 让 AI 通过 function call 输出结构化题目 */
    private static final String TOOL_DEFINITION = """
    [
      {
        "type": "function",
        "function": {
          "name": "create_exam_questions",
          "description": "批量创建考试题目，支持选择、判断、填空、简答四种题型",
          "parameters": {
            "type": "object",
            "properties": {
              "questions": {
                "type": "array",
                "description": "题目列表",
                "items": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": ["choice", "true_false", "fill", "short_answer"],
                      "description": "题型：choice=单选 true_false=判断 fill=填空 short_answer=简答"
                    },
                    "content": {
                      "type": "string",
                      "description": "题目内容。填空题用____标出空白处"
                    },
                    "options": {
                      "type": "string",
                      "description": "选项，仅选择题需要，每行一个，格式：A. xxx\\nB. xxx\\nC. xxx\\nD. xxx"
                    },
                    "answer": {
                      "type": "string",
                      "description": "标准答案。选择题写A/B/C/D，判断题写对或错，填空题写答案，简答题写参考答案"
                    },
                    "score": {
                      "type": "integer",
                      "description": "分值"
                    }
                  },
                  "required": ["type", "content", "answer", "score"]
                }
              }
            },
            "required": ["questions"]
          }
        }
      }
    ]
    """;

    @PostMapping("/{id}/ai-generate")
    public ApiResponse<?> aiGenerate(@PathVariable Long id, @RequestBody Map<String, Object> params, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");
        if (!"teacher".equals(u.getRole()) && !"admin".equals(u.getRole()))
            return ApiResponse.fail("仅教师可操作");

        String subject = (String) params.getOrDefault("subject", "综合");
        String knowledgePoints = (String) params.getOrDefault("knowledgePoints", "");
        int count = (int) params.getOrDefault("count", 5);
        @SuppressWarnings("unchecked")
        List<String> types = (List<String>) params.getOrDefault("types",
                List.of("choice", "true_false", "fill", "short_answer"));
        String difficulty = (String) params.getOrDefault("difficulty", "中等");

        String typesDesc = buildTypesDescription(types);

        // 精简 prompt：不再要求 AI 返回 JSON，而是通过 tool call 结构化输出
        String prompt = String.format(
                "请为【%s】科目出 %d 道考试题。知识点：%s。难度：%s。题型要求：%s。" +
                "选择题必须有4个选项(ABCD)，判断题答案填对或错，填空题用____标空白，简答题写完整参考答案。" +
                "分值合理分配（选择/判断2-5分，填空5-10分，简答10-20分）。调用 create_exam_questions 工具来创建题目。",
                subject, count, knowledgePoints.isEmpty() ? "不限" : knowledgePoints, difficulty, typesDesc);

        try {
            // 使用 Tool Calling：AI 返回结构化 function arguments，而非自由文本
            String argsJson = aiChatService.chatWithTools(
                    "你是专业出题老师。必须调用 create_exam_questions 工具来创建题目。",
                    prompt,
                    TOOL_DEFINITION);

            // 解析 function arguments
            JsonNode argsNode = objectMapper.readTree(argsJson);
            JsonNode questionsNode = argsNode.path("questions");
            if (!questionsNode.isArray() || questionsNode.isEmpty()) {
                // 兜底：如果 tool call 失败，尝试按旧逻辑解析
                return ApiResponse.fail("AI未返回有效题目，请重试");
            }

            List<ExamQuestion> inserted = new ArrayList<>();
            int sortOrder = mapper.selectQuestions(id).size();

            for (JsonNode qNode : questionsNode) {
                ExamQuestion eq = new ExamQuestion();
                eq.setExamId(id);
                eq.setType(qNode.path("type").asText("choice"));
                eq.setContent(qNode.path("content").asText(""));
                eq.setOptions(qNode.path("options").asText(""));
                eq.setAnswer(qNode.path("answer").asText(""));
                eq.setScore(qNode.path("score").asInt(10));
                eq.setSortOrder(++sortOrder);
                mapper.insertQuestion(eq);
                inserted.add(eq);
            }

            return ApiResponse.ok("AI已生成 " + inserted.size() + " 道题目", inserted);
        } catch (Exception ex) {
            return ApiResponse.fail("AI出题失败: " + ex.getMessage());
        }
    }

    // ===== 学生提交 + 自动判卷 + 错题录入 =====

    @PostMapping("/{id}/submit")
    public ApiResponse<?> submit(@PathVariable Long id, @RequestBody ExamSubmission s, HttpSession session) {
        User u = (User) session.getAttribute("currentUser");

        // 获取题目和标准答案
        List<ExamQuestion> questions = mapper.selectQuestions(id);
        Exam exam = mapper.selectById(id);

        // 解析学生答案 JSON: { "questionId": "studentAnswer", ... }
        Map<String, String> studentAnswers;
        try {
            studentAnswers = objectMapper.readValue(s.getAnswers(),
                    new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            studentAnswers = new HashMap<>();
        }

        // 自动判卷
        int totalScore = 0;
        List<Map<String, Object>> gradeDetails = new ArrayList<>();
        List<ExamQuestion> wrongQuestions = new ArrayList<>();

        for (ExamQuestion q : questions) {
            String studentAns = studentAnswers.getOrDefault(String.valueOf(q.getId()), "");
            boolean correct = isCorrect(q, studentAns);

            Map<String, Object> detail = new HashMap<>();
            detail.put("questionId", q.getId());
            detail.put("studentAnswer", studentAns);
            detail.put("correctAnswer", q.getAnswer());
            detail.put("correct", correct);
            detail.put("score", correct ? q.getScore() : 0);
            detail.put("maxScore", q.getScore());
            gradeDetails.add(detail);

            if (correct) {
                totalScore += q.getScore();
            } else {
                wrongQuestions.add(q);
            }
        }

        // 保存提交
        ExamSubmission existing = mapper.selectSubmission(id, u.getId());
        String feedbackJson;
        try {
            feedbackJson = objectMapper.writeValueAsString(gradeDetails);
        } catch (Exception e) {
            feedbackJson = "[]";
        }

        if (existing == null) {
            s.setExamId(id);
            s.setStudentId(u.getId());
            s.setScore(totalScore);
            s.setAiFeedback(feedbackJson);
            s.setStatus("graded");
            mapper.insertSubmission(s);
        } else {
            existing.setAnswers(s.getAnswers());
            existing.setScore(totalScore);
            existing.setAiFeedback(feedbackJson);
            existing.setStatus("graded");
            mapper.updateSubmission(existing);
        }

        // 错题自动录入
        for (ExamQuestion wq : wrongQuestions) {
            String studentAns = studentAnswers.getOrDefault(String.valueOf(wq.getId()), "");
            WrongQuestion wrong = new WrongQuestion();
            wrong.setUserId(u.getId());
            wrong.setSubject(exam.getTitle());
            wrong.setContent(wq.getContent());
            wrong.setCorrectAnswer(wq.getAnswer());
            wrong.setMyAnswer(studentAns);
            wrong.setKnowledgePoint(wq.getType());
            wrong.setMastery("unmastered");
            wrong.setSource("exam");
            wrong.setSourceId(id);
            wrongQuestionMapper.insert(wrong);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("score", totalScore);
        result.put("totalScore", exam.getTotalScore());
        result.put("correctCount", questions.size() - wrongQuestions.size());
        result.put("totalCount", questions.size());
        result.put("wrongCount", wrongQuestions.size());
        result.put("details", gradeDetails);

        return ApiResponse.ok("提交成功，得分: " + totalScore + "/" + exam.getTotalScore(), result);
    }

    // ===== 成绩统计 =====

    @GetMapping("/{id}/submissions")
    public ApiResponse<?> submissions(@PathVariable Long id) {
        return ApiResponse.ok(mapper.selectSubmissions(id));
    }

    @GetMapping("/{id}/stats")
    public ApiResponse<?> stats(@PathVariable Long id) {
        List<ExamSubmission> submissions = mapper.selectSubmissions(id);
        Exam exam = mapper.selectById(id);

        int count = submissions.size();
        double avgScore = submissions.stream().mapToInt(s -> s.getScore() != null ? s.getScore() : 0).average().orElse(0);
        int maxScore = submissions.stream().mapToInt(s -> s.getScore() != null ? s.getScore() : 0).max().orElse(0);
        int minScore = submissions.stream().mapToInt(s -> s.getScore() != null ? s.getScore() : 0).min().orElse(0);
        long passCount = submissions.stream().filter(s -> s.getScore() != null && s.getScore() >= exam.getTotalScore() * 0.6).count();

        // 分数段统计
        Map<String, Integer> distribution = new LinkedHashMap<>();
        distribution.put("90-100%", 0);
        distribution.put("80-89%", 0);
        distribution.put("70-79%", 0);
        distribution.put("60-69%", 0);
        distribution.put("0-59%", 0);
        for (ExamSubmission sub : submissions) {
            if (sub.getScore() == null) continue;
            double pct = (double) sub.getScore() / exam.getTotalScore() * 100;
            if (pct >= 90) distribution.merge("90-100%", 1, Integer::sum);
            else if (pct >= 80) distribution.merge("80-89%", 1, Integer::sum);
            else if (pct >= 70) distribution.merge("70-79%", 1, Integer::sum);
            else if (pct >= 60) distribution.merge("60-69%", 1, Integer::sum);
            else distribution.merge("0-59%", 1, Integer::sum);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalStudents", count);
        result.put("avgScore", Math.round(avgScore * 100.0) / 100.0);
        result.put("maxScore", maxScore);
        result.put("minScore", minScore);
        result.put("passRate", count > 0 ? Math.round((double) passCount / count * 10000.0) / 100.0 : 0);
        result.put("distribution", distribution);
        result.put("submissions", submissions);

        return ApiResponse.ok(result);
    }

    // ===== 判卷逻辑 =====

    private boolean isCorrect(ExamQuestion q, String studentAnswer) {
        if (studentAnswer == null || studentAnswer.isBlank()) return false;
        String correct = q.getAnswer().trim();
        String student = studentAnswer.trim();

        switch (q.getType()) {
            case "choice":
            case "true_false":
                // 不区分大小写
                return correct.equalsIgnoreCase(student);
            case "fill":
                // 填空题：去空格后比较
                return correct.replaceAll("\\s+", "").equalsIgnoreCase(student.replaceAll("\\s+", ""));
            case "short_answer":
                // 简答题：包含关键词即得分（简化逻辑，关键词匹配>50%）
                String[] keywords = correct.split("[,，、；;。.\\s]+");
                int matched = 0;
                for (String kw : keywords) {
                    if (kw.length() >= 2 && student.contains(kw)) matched++;
                }
                return keywords.length > 0 && (double) matched / keywords.length >= 0.5;
            default:
                return correct.equalsIgnoreCase(student);
        }
    }

    private String buildTypesDescription(List<String> types) {
        StringBuilder sb = new StringBuilder();
        for (String t : types) {
            switch (t) {
                case "choice": sb.append("选择题（单选，4个选项ABCD）、"); break;
                case "true_false": sb.append("判断题（对/错）、"); break;
                case "fill": sb.append("填空题（用____标空白）、"); break;
                case "short_answer": sb.append("简答题/问答题、"); break;
            }
        }
        return sb.toString();
    }
}
