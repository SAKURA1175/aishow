import axios from 'axios'

// ===== 班级管理 =====
export const createClass = (data) => axios.post('/api/class/create', data)
export const joinClass = (code) => axios.post(`/api/class/join?inviteCode=${code}`)
export const getMyClasses = () => axios.get('/api/class/my')
export const getClassDetail = (id) => axios.get(`/api/class/${id}`)
export const getClassMembers = (id) => axios.get(`/api/class/${id}/members`)
export const updateClass = (id, data) => axios.put(`/api/class/${id}`, data)
export const removeMember = (classId, userId) => axios.delete(`/api/class/${classId}/members/${userId}`)

// ===== 作业系统 =====
export const createAssignment = (data) => axios.post('/api/assignment/create', data)
export const updateAssignment = (id, data) => axios.put(`/api/assignment/${id}`, data)
export const getAssignmentDetail = (id) => axios.get(`/api/assignment/${id}`)
export const getMyAssignments = () => axios.get('/api/assignment/my')
export const submitAssignment = (id, data) => axios.post(`/api/assignment/${id}/submit`, data)
export const getSubmissions = (id) => axios.get(`/api/assignment/${id}/submissions`)
export const getMySubmission = (id) => axios.get(`/api/assignment/${id}/my-submission`)
export const gradeSubmission = (subId, data) => axios.post(`/api/assignment/submissions/${subId}/grade`, data)

// ===== 成绩管理 =====
export const createCourse = (data) => axios.post('/api/grade/course', data)
export const getCourses = () => axios.get('/api/grade/courses')
export const addGrade = (data) => axios.post('/api/grade/record', data)
export const updateGrade = (id, data) => axios.put(`/api/grade/record/${id}`, data)
export const deleteGrade = (id) => axios.delete(`/api/grade/record/${id}`)
export const getMyGrades = (semester) => axios.get('/api/grade/my', { params: { semester } })
export const getGpa = () => axios.get('/api/grade/gpa')
export const getCourseGrades = (courseId) => axios.get(`/api/grade/course/${courseId}`)

// ===== 待办 & 日程 =====
export const createTodo = (data) => axios.post('/api/todo', data)
export const updateTodo = (id, data) => axios.put(`/api/todo/${id}`, data)
export const deleteTodo = (id) => axios.delete(`/api/todo/${id}`)
export const toggleTodo = (id) => axios.post(`/api/todo/${id}/toggle`)
export const getTodos = (status) => axios.get('/api/todo/list', { params: { status } })
export const createEvent = (data) => axios.post('/api/todo/event', data)
export const updateEvent = (id, data) => axios.put(`/api/todo/event/${id}`, data)
export const deleteEvent = (id) => axios.delete(`/api/todo/event/${id}`)
export const getEvents = (start, end) => axios.get('/api/todo/events', { params: { start, end } })

// ===== 错题本 =====
export const addWrongQuestion = (data) => axios.post('/api/wrong-question', data)
export const updateWrongQuestion = (id, data) => axios.put(`/api/wrong-question/${id}`, data)
export const deleteWrongQuestion = (id) => axios.delete(`/api/wrong-question/${id}`)
export const getMyWrongQuestions = (subject) => axios.get('/api/wrong-question/my', { params: { subject } })
export const setQuestionMastery = (id, mastery) => axios.post(`/api/wrong-question/${id}/mastery?mastery=${mastery}`)

// ===== 课程笔记 =====
export const createNotebook = (data) => axios.post('/api/notebook', data)
export const updateNotebook = (id, data) => axios.put(`/api/notebook/${id}`, data)
export const deleteNotebook = (id) => axios.delete(`/api/notebook/${id}`)
export const getNotebookDetail = (id) => axios.get(`/api/notebook/${id}`)
export const getMyNotebooks = () => axios.get('/api/notebook/my')
export const getSharedNotebooks = () => axios.get('/api/notebook/shared')

// ===== 讨论区 =====
export const createPost = (data) => axios.post('/api/post', data)
export const updatePost = (id, data) => axios.put(`/api/post/${id}`, data)
export const deletePost = (id) => axios.delete(`/api/post/${id}`)
export const getPosts = () => axios.get('/api/post')
export const getPostDetail = (id) => axios.get(`/api/post/${id}`)
export const replyPost = (id, data) => axios.post(`/api/post/${id}/reply`, data)

// ===== 打卡 & 成就 =====
export const doCheckin = (data) => axios.post('/api/checkin', data)
export const getCheckinStats = () => axios.get('/api/checkin/stats')

// ===== 考试系统 =====
export const createExam = (data) => axios.post('/api/exam', data)
export const updateExam = (id, data) => axios.put(`/api/exam/${id}`, data)
export const getMyExams = () => axios.get('/api/exam/my')
export const getExamDetail = (id) => axios.get(`/api/exam/${id}`)
export const addExamQuestion = (id, data) => axios.post(`/api/exam/${id}/question`, data)
export const updateExamQuestion = (qid, data) => axios.put(`/api/exam/question/${qid}`, data)
export const deleteExamQuestion = (qid) => axios.delete(`/api/exam/question/${qid}`)
export const submitExam = (id, data) => axios.post(`/api/exam/${id}/submit`, data)
export const getExamSubmissions = (id) => axios.get(`/api/exam/${id}/submissions`)
export const aiGenerateQuestions = (id, params) => axios.post(`/api/exam/${id}/ai-generate`, params)
export const getExamStats = (id) => axios.get(`/api/exam/${id}/stats`)
