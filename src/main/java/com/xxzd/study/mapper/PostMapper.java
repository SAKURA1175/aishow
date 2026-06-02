package com.xxzd.study.mapper;
import com.xxzd.study.domain.Post;
import com.xxzd.study.domain.PostReply;
import org.apache.ibatis.annotations.*;
import java.util.List;
@Mapper
public interface PostMapper {
    @Insert("INSERT INTO post(user_id,course_id,title,content,tags) VALUES(#{userId},#{courseId},#{title},#{content},#{tags})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insertPost(Post p);
    @Update("UPDATE post SET title=#{title},content=#{content},tags=#{tags},update_time=NOW() WHERE id=#{id}")
    void updatePost(Post p);
    @Delete("DELETE FROM post WHERE id=#{id}")
    void deletePost(Long id);
    @Select("SELECT p.*,u.username as author_name,(SELECT COUNT(*) FROM post_reply r WHERE r.post_id=p.id) as reply_count FROM post p LEFT JOIN user u ON p.user_id=u.id WHERE p.id=#{id}")
    Post selectById(Long id);
    @Select("SELECT p.*,u.username as author_name,(SELECT COUNT(*) FROM post_reply r WHERE r.post_id=p.id) as reply_count FROM post p LEFT JOIN user u ON p.user_id=u.id ORDER BY p.is_pinned DESC, p.create_time DESC")
    List<Post> selectAll();
    @Update("UPDATE post SET view_count=view_count+1 WHERE id=#{id}")
    void incrementView(Long id);
    @Update("UPDATE post SET reply_count=reply_count+1 WHERE id=#{id}")
    void incrementReply(Long id);
    @Insert("INSERT INTO post_reply(post_id,user_id,parent_reply_id,content,is_ai_generated) VALUES(#{postId},#{userId},#{parentReplyId},#{content},#{isAiGenerated})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insertReply(PostReply r);
    @Delete("DELETE FROM post_reply WHERE id=#{id}")
    void deleteReply(Long id);
    @Select("SELECT r.*,u.username as author_name FROM post_reply r LEFT JOIN user u ON r.user_id=u.id WHERE r.post_id=#{postId} ORDER BY r.create_time")
    List<PostReply> selectReplies(Long postId);
}
