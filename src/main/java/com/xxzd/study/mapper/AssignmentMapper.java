package com.xxzd.study.mapper;

import com.xxzd.study.domain.Assignment;
import com.xxzd.study.domain.AssignmentSubmission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AssignmentMapper {

    void insertAssignment(Assignment assignment);

    void updateAssignment(Assignment assignment);

    Assignment selectById(Long id);

    List<Assignment> selectByTeacherId(Long teacherId);

    List<Assignment> selectByClassId(Long classId);

    /** 学生看到的作业（通过班级关联） */
    List<Assignment> selectByStudentId(Long studentId);

    void insertSubmission(AssignmentSubmission submission);

    void updateSubmission(AssignmentSubmission submission);

    AssignmentSubmission selectSubmission(@Param("assignmentId") Long assignmentId, @Param("studentId") Long studentId);

    AssignmentSubmission selectSubmissionById(Long id);

    List<AssignmentSubmission> selectSubmissionsByAssignment(Long assignmentId);

    List<AssignmentSubmission> selectSubmissionsByStudent(Long studentId);

    int countSubmissions(Long assignmentId);

    int countGraded(Long assignmentId);
}
