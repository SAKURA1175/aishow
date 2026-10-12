import axios from 'axios'

/**
 * 获取用户可访问的班级列表
 */
export const getScreenClasses = () => axios.get('/api/analytics/classes')

/**
 * 获取学情大屏聚合分析数据
 * @param {number|string} classId 班级ID
 * @param {number|string} courseId 课程ID（可选）
 */
export const getScreenData = (classId, courseId) =>
  axios.get('/api/analytics/screen', {
    params: {
      classId: classId || undefined,
      courseId: courseId || undefined
    }
  })
