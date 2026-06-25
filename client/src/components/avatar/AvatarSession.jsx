import { useState } from 'react'
import { HomeworkUpload } from './HomeworkUpload.jsx'
import { StudentCamera } from './StudentCamera.jsx'
import { TutorAvatar } from './TutorAvatar.jsx'
import './avatar.css'

export function AvatarSession({ nickname = 'хүүхэд', avatar = 'sun-buddy' }) {
  const [homeworkContext, setHomeworkContext] = useState('')
  const [problems, setProblems] = useState([])

  const handleHomeworkLoaded = (context, problemList = []) => {
    setHomeworkContext(context)
    setProblems(problemList)
  }

  return (
    <div className="session-layout">
      {/* LEFT 30% */}
      <div className="session-left">
        <div className="session-homework">
          <HomeworkUpload onHomeworkLoaded={handleHomeworkLoaded} />
        </div>
        <div className="session-camera">
          <StudentCamera />
        </div>
      </div>

      {/* RIGHT 70% */}
      <div className="session-right">
        <TutorAvatar nickname={nickname} homeworkContext={homeworkContext} problems={problems} avatar={avatar} />
      </div>
    </div>
  )
}
