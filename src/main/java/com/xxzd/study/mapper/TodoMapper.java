package com.xxzd.study.mapper;

import com.xxzd.study.domain.Todo;
import com.xxzd.study.domain.ScheduleEvent;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

@Mapper
public interface TodoMapper {

    // ===== 待办 =====
    void insertTodo(Todo todo);

    void updateTodo(Todo todo);

    void deleteTodo(Long id);

    Todo selectTodoById(Long id);

    List<Todo> selectTodosByUser(@Param("userId") Long userId, @Param("status") String status);

    int countPending(Long userId);

    // ===== 日程 =====
    void insertEvent(ScheduleEvent event);

    void updateEvent(ScheduleEvent event);

    void deleteEvent(Long id);

    ScheduleEvent selectEventById(Long id);

    List<ScheduleEvent> selectEventsByUser(@Param("userId") Long userId,
                                           @Param("startTime") Date startTime,
                                           @Param("endTime") Date endTime);
}
