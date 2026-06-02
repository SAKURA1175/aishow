package com.xxzd.study.mapper;
import com.xxzd.study.domain.Checkin;
import org.apache.ibatis.annotations.*;
import java.util.List;
@Mapper
public interface CheckinMapper {
    @Insert("INSERT INTO checkin(user_id,checkin_date,study_minutes,content) VALUES(#{userId},#{checkinDate},#{studyMinutes},#{content})")
    @Options(useGeneratedKeys=true, keyProperty="id")
    void insert(Checkin c);
    @Select("SELECT * FROM checkin WHERE user_id=#{userId} ORDER BY checkin_date DESC")
    List<Checkin> selectByUser(Long userId);
    @Select("SELECT * FROM checkin WHERE user_id=#{userId} AND checkin_date=CURDATE()")
    Checkin selectToday(Long userId);
    @Select("SELECT COUNT(*) FROM checkin WHERE user_id=#{userId}")
    int countTotal(Long userId);
    @Select("SELECT COALESCE(SUM(study_minutes),0) FROM checkin WHERE user_id=#{userId}")
    int sumMinutes(Long userId);
    @Insert("INSERT INTO points_log(user_id,action,points,description) VALUES(#{userId},#{action},#{points},#{description})")
    void addPoints(@Param("userId") Long userId, @Param("action") String action, @Param("points") int points, @Param("description") String description);
    @Select("SELECT COALESCE(SUM(points),0) FROM points_log WHERE user_id=#{userId}")
    int totalPoints(Long userId);
    @Select("SELECT * FROM points_log WHERE user_id=#{userId} ORDER BY create_time DESC LIMIT 20")
    List<java.util.Map<String,Object>> recentPoints(Long userId);
}
