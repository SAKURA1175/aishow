package com.xxzd.study.mapper;

import com.xxzd.study.domain.Course;
import com.xxzd.study.domain.Grade;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface GradeMapper {

    void insertCourse(Course course);

    void updateCourse(Course course);

    Course selectCourseById(Long id);

    List<Course> selectCoursesByTeacher(Long teacherId);

    List<Course> selectCoursesByClass(Long classId);

    void insertGrade(Grade grade);

    void updateGrade(Grade grade);

    void deleteGrade(Long id);

    List<Grade> selectGradesByUser(@Param("userId") Long userId, @Param("semester") String semester);

    List<Grade> selectGradesByCourse(Long courseId);

    /** 计算加权 GPA */
    List<Grade> selectAllGradesForGpa(Long userId);
}
