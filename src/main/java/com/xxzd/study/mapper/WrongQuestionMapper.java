package com.xxzd.study.mapper;
import com.xxzd.study.domain.WrongQuestion;
import org.apache.ibatis.annotations.*;
import java.util.List;
@Mapper
public interface WrongQuestionMapper {
    @Insert("INSERT INTO wrong_question(user_id,subject,content,correct_answer,my_answer,ai_analysis,knowledge_point,mastery,source,source_id) VALUES(#{userId},#{subject},#{content},#{correctAnswer},#{myAnswer},#{aiAnalysis},#{knowledgePoint},#{mastery},#{source},#{sourceId})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insert(WrongQuestion q);
    @Update("UPDATE wrong_question SET subject=#{subject},content=#{content},correct_answer=#{correctAnswer},my_answer=#{myAnswer},ai_analysis=#{aiAnalysis},knowledge_point=#{knowledgePoint},mastery=#{mastery} WHERE id=#{id}")
    void update(WrongQuestion q);
    @Delete("DELETE FROM wrong_question WHERE id=#{id}")
    void delete(Long id);
    @Select("SELECT * FROM wrong_question WHERE id=#{id}")
    WrongQuestion selectById(Long id);
    @Select("SELECT * FROM wrong_question WHERE user_id=#{userId} ORDER BY create_time DESC")
    List<WrongQuestion> selectByUser(Long userId);
    @Select("SELECT * FROM wrong_question WHERE user_id=#{userId} AND subject=#{subject} ORDER BY create_time DESC")
    List<WrongQuestion> selectByUserAndSubject(@Param("userId") Long userId, @Param("subject") String subject);
}
