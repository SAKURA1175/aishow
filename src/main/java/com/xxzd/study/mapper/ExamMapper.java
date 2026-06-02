package com.xxzd.study.mapper;
import com.xxzd.study.domain.Exam;
import com.xxzd.study.domain.ExamQuestion;
import com.xxzd.study.domain.ExamSubmission;
import org.apache.ibatis.annotations.*;
import java.util.List;
@Mapper
public interface ExamMapper {
    @Insert("INSERT INTO exam(title,course_id,teacher_id,class_id,duration,total_score,status,start_time,end_time) VALUES(#{title},#{courseId},#{teacherId},#{classId},#{duration},#{totalScore},#{status},#{startTime},#{endTime})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insertExam(Exam e);
    @Update("UPDATE exam SET title=#{title},duration=#{duration},total_score=#{totalScore},status=#{status},start_time=#{startTime},end_time=#{endTime} WHERE id=#{id}")
    void updateExam(Exam e);
    @Select("SELECT e.*,u.username as teacher_name,(SELECT COUNT(*) FROM exam_question WHERE exam_id=e.id) as question_count,(SELECT COUNT(*) FROM exam_submission WHERE exam_id=e.id) as submission_count FROM exam e LEFT JOIN user u ON e.teacher_id=u.id WHERE e.id=#{id}")
    Exam selectById(Long id);
    @Select("SELECT e.*,u.username as teacher_name,(SELECT COUNT(*) FROM exam_question WHERE exam_id=e.id) as question_count FROM exam e LEFT JOIN user u ON e.teacher_id=u.id WHERE e.teacher_id=#{teacherId} ORDER BY e.create_time DESC")
    List<Exam> selectByTeacher(Long teacherId);
    @Select("SELECT e.*,u.username as teacher_name,(SELECT COUNT(*) FROM exam_question WHERE exam_id=e.id) as question_count FROM exam e LEFT JOIN user u ON e.teacher_id=u.id WHERE e.status='published' AND e.class_id IN (SELECT class_id FROM class_member WHERE user_id=#{studentId}) ORDER BY e.start_time DESC")
    List<Exam> selectByStudent(Long studentId);
    @Insert("INSERT INTO exam_question(exam_id,type,content,options,answer,score,sort_order) VALUES(#{examId},#{type},#{content},#{options},#{answer},#{score},#{sortOrder})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insertQuestion(ExamQuestion q);
    @Update("UPDATE exam_question SET type=#{type},content=#{content},options=#{options},answer=#{answer},score=#{score} WHERE id=#{id}")
    void updateQuestion(ExamQuestion q);
    @Delete("DELETE FROM exam_question WHERE id=#{id}")
    void deleteQuestion(Long id);
    @Select("SELECT * FROM exam_question WHERE exam_id=#{examId} ORDER BY sort_order")
    List<ExamQuestion> selectQuestions(Long examId);
    @Insert("INSERT INTO exam_submission(exam_id,student_id,status) VALUES(#{examId},#{studentId},'in_progress')")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insertSubmission(ExamSubmission s);
    @Update("UPDATE exam_submission SET answers=#{answers},score=#{score},ai_feedback=#{aiFeedback},status=#{status},submit_time=NOW() WHERE id=#{id}")
    void updateSubmission(ExamSubmission s);
    @Select("SELECT s.*,u.username as student_name FROM exam_submission s LEFT JOIN user u ON s.student_id=u.id WHERE s.exam_id=#{examId} AND s.student_id=#{studentId}")
    ExamSubmission selectSubmission(@Param("examId") Long examId, @Param("studentId") Long studentId);
    @Select("SELECT s.*,u.username as student_name FROM exam_submission s LEFT JOIN user u ON s.student_id=u.id WHERE s.exam_id=#{examId} ORDER BY s.score DESC")
    List<ExamSubmission> selectSubmissions(Long examId);
}
