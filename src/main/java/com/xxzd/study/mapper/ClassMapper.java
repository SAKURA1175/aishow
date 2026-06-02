package com.xxzd.study.mapper;

import com.xxzd.study.domain.StudyClass;
import com.xxzd.study.domain.ClassMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ClassMapper {

    void insertClass(StudyClass studyClass);

    void updateClass(StudyClass studyClass);

    StudyClass selectById(Long id);

    StudyClass selectByInviteCode(String inviteCode);

    List<StudyClass> selectByTeacherId(Long teacherId);

    /** 查学生所在的班级 */
    List<StudyClass> selectByUserId(Long userId);

    void insertMember(ClassMember member);

    void deleteMember(@Param("classId") Long classId, @Param("userId") Long userId);

    ClassMember selectMember(@Param("classId") Long classId, @Param("userId") Long userId);

    List<ClassMember> selectMembersByClassId(Long classId);

    int countMembers(Long classId);
}
