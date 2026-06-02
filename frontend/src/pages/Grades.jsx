import { useState, useEffect } from 'react'
import { Award, Plus, TrendingUp, Book, Users } from 'lucide-react'
import useStore from '@/store/useStore'
import { getMyGrades, getGpa, createCourse, getCourses, addGrade, getMyClasses, getClassMembers } from '@/api/modules'
import { motion, AnimatePresence } from 'framer-motion'

export default function Grades() {
  const { user } = useStore()
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const [grades, setGrades] = useState([])
  const [gpaData, setGpaData] = useState({ gpa: 0, totalCredits: 0, courseCount: 0 })
  const [courses, setCourses] = useState([])
  const [classes, setClasses] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddGrade, setShowAddGrade] = useState(false)
  
  const [courseForm, setCourseForm] = useState({ name: '', credit: 2.0, semester: '', classId: '' })
  const [gradeForm, setGradeForm] = useState({ userId: '', courseId: '', score: '', gradeType: 'final', semester: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      if (isTeacher) {
        const [cRes, clsRes] = await Promise.all([getCourses(), getMyClasses()])
        setCourses(cRes.data?.data || [])
        setClasses(clsRes.data?.data || [])
      } else {
        const [gRes, gpaRes] = await Promise.all([getMyGrades(), getGpa()])
        setGrades(gRes.data?.data || [])
        setGpaData(gpaRes.data?.data || { gpa: 0, totalCredits: 0, courseCount: 0 })
      }
    } catch {}
    setLoading(false)
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    try {
      await createCourse({
        ...courseForm,
        credit: Number(courseForm.credit),
        classId: courseForm.classId ? Number(courseForm.classId) : null
      })
      setShowAddCourse(false)
      setCourseForm({ name: '', credit: 2.0, semester: '', classId: '' })
      loadData()
    } catch {}
  }

  const handleAddGrade = async (e) => {
    e.preventDefault()
    try {
      await addGrade({
        ...gradeForm,
        userId: Number(gradeForm.userId),
        courseId: Number(gradeForm.courseId),
        score: Number(gradeForm.score)
      })
      setShowAddGrade(false)
      setGradeForm({ userId: '', courseId: '', score: '', gradeType: 'final', semester: '' })
      loadData()
    } catch {}
  }

  const handleCourseForGrade = async (courseId) => {
    const course = courses.find(c => String(c.id) === String(courseId))
    setGradeForm({
      ...gradeForm,
      courseId,
      userId: '',
      semester: course?.semester || gradeForm.semester
    })
    if (course?.classId) {
      try {
        const r = await getClassMembers(course.classId)
        setMembers((r.data?.data || []).filter(m => m.userRole !== 'teacher'))
      } catch {
        setMembers([])
      }
    } else {
      setMembers([])
    }
  }

  const formatNumber = (value, digits = 2) => {
    const n = Number(value || 0)
    return n.toFixed(digits)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">成绩管理</h1>
            <p className="text-xs text-muted-foreground">{isTeacher ? '课程和成绩录入' : '我的成绩与学情分析'}</p>
          </div>
        </div>
        {isTeacher && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddCourse(true)} className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors">
              <Book className="w-4 h-4" /> 添加课程
            </button>
            <button onClick={() => setShowAddGrade(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> 录入成绩
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {!isTeacher && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-5 rounded-xl border border-border/50 bg-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均绩点 (GPA)</p>
                <p className="text-2xl font-bold text-foreground">{formatNumber(gpaData.gpa)}</p>
              </div>
            </div>
            <div className="p-5 rounded-xl border border-border/50 bg-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总学分</p>
                <p className="text-2xl font-bold text-foreground">{gpaData.totalCredits || 0}</p>
              </div>
            </div>
            <div className="p-5 rounded-xl border border-border/50 bg-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Book className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已修课程</p>
                <p className="text-2xl font-bold text-foreground">{gpaData.courseCount || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                {isTeacher ? (
                  <>
                    <th className="p-4 font-medium text-muted-foreground">课程名称</th>
                    <th className="p-4 font-medium text-muted-foreground">班级</th>
                    <th className="p-4 font-medium text-muted-foreground">学分</th>
                    <th className="p-4 font-medium text-muted-foreground">学期</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-medium text-muted-foreground">课程名称</th>
                    <th className="p-4 font-medium text-muted-foreground">学期</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">学分</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">成绩</th>
                    <th className="p-4 font-medium text-muted-foreground text-center">绩点</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">加载中...</td></tr>
              ) : isTeacher ? (
                courses.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-muted-foreground">暂无课程</td></tr> :
                courses.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4 text-muted-foreground">{c.className || '未关联班级'}</td>
                    <td className="p-4">{c.credit}</td>
                    <td className="p-4 text-muted-foreground">{c.semester || '-'}</td>
                  </tr>
                ))
              ) : (
                grades.length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-muted-foreground">暂无成绩记录</td></tr> :
                grades.map(g => (
                  <tr key={g.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-4 font-medium">{g.courseName}</td>
                    <td className="p-4 text-muted-foreground">{g.semester}</td>
                    <td className="p-4 text-center">{g.courseCredit}</td>
                    <td className="p-4 text-center font-bold">{g.score}</td>
                    <td className="p-4 text-center text-purple-500 font-medium">{g.gradePoint}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddCourse && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowAddCourse(false)}>
            <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleCreateCourse} className="bg-card border border-border rounded-2xl p-6 w-[400px] shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">添加课程</h3>
              <div className="space-y-4">
                <input placeholder="课程名称 *" required value={courseForm.name} onChange={e=>setCourseForm({...courseForm,name:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
                <input type="number" step="0.5" placeholder="学分 *" required value={courseForm.credit} onChange={e=>setCourseForm({...courseForm,credit:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
                <input placeholder="学期 (如 2025-春)" value={courseForm.semester} onChange={e=>setCourseForm({...courseForm,semester:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
                <select value={courseForm.classId} onChange={e=>setCourseForm({...courseForm,classId:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none">
                  <option value="">不关联班级</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setShowAddCourse(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium">添加</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddGrade && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={()=>setShowAddGrade(false)}>
            <motion.form initial={{scale:.95}} animate={{scale:1}} onClick={e=>e.stopPropagation()} onSubmit={handleAddGrade} className="bg-card border border-border rounded-2xl p-6 w-[460px] shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">录入成绩</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">课程</label>
                  <select required value={gradeForm.courseId} onChange={e=>handleCourseForGrade(e.target.value)} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none">
                    <option value="">选择课程</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}{c.className ? ` - ${c.className}` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" />学生</label>
                  {members.length > 0 ? (
                    <select required value={gradeForm.userId} onChange={e=>setGradeForm({...gradeForm,userId:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none">
                      <option value="">选择班级成员</option>
                      {members.map(m => <option key={m.userId} value={m.userId}>{m.username}</option>)}
                    </select>
                  ) : (
                    <input required placeholder="学生ID（课程未关联班级时填写）" value={gradeForm.userId} onChange={e=>setGradeForm({...gradeForm,userId:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" min="0" max="100" required placeholder="成绩" value={gradeForm.score} onChange={e=>setGradeForm({...gradeForm,score:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
                  <select value={gradeForm.gradeType} onChange={e=>setGradeForm({...gradeForm,gradeType:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none">
                    <option value="final">期末</option>
                    <option value="midterm">期中</option>
                    <option value="quiz">测验</option>
                    <option value="assignment">作业</option>
                  </select>
                </div>
                <input placeholder="学期" value={gradeForm.semester} onChange={e=>setGradeForm({...gradeForm,semester:e.target.value})} className="w-full px-3 py-2 bg-muted rounded-lg text-sm border border-border/50 focus:border-purple-500 focus:outline-none"/>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={()=>setShowAddGrade(false)} className="px-4 py-2 text-sm text-muted-foreground">取消</button>
                <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium">录入</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
