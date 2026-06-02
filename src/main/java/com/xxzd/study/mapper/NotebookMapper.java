package com.xxzd.study.mapper;
import com.xxzd.study.domain.Notebook;
import org.apache.ibatis.annotations.*;
import java.util.List;
@Mapper
public interface NotebookMapper {
    @Insert("INSERT INTO notebook(user_id,course_id,title,content,ai_summary,tags,is_shared) VALUES(#{userId},#{courseId},#{title},#{content},#{aiSummary},#{tags},#{isShared})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insert(Notebook n);
    @Update("UPDATE notebook SET title=#{title},content=#{content},ai_summary=#{aiSummary},tags=#{tags},is_shared=#{isShared},update_time=NOW() WHERE id=#{id}")
    void update(Notebook n);
    @Delete("DELETE FROM notebook WHERE id=#{id}")
    void delete(Long id);
    @Select("SELECT * FROM notebook WHERE id=#{id}")
    Notebook selectById(Long id);
    @Select("SELECT n.*,u.username as author_name FROM notebook n LEFT JOIN user u ON n.user_id=u.id WHERE n.user_id=#{userId} ORDER BY n.update_time DESC")
    List<Notebook> selectByUser(Long userId);
    @Select("SELECT n.*,u.username as author_name FROM notebook n LEFT JOIN user u ON n.user_id=u.id WHERE n.is_shared=true ORDER BY n.update_time DESC")
    List<Notebook> selectShared();
}
