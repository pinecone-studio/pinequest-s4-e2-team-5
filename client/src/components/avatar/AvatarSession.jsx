import { useState } from 'react'
import { HomeworkUpload } from './HomeworkUpload.jsx'
import { StudentCamera } from './StudentCamera.jsx'
import { TutorAvatar } from './TutorAvatar.jsx'
import './avatar.css'

export function AvatarSession({ nickname = 'хүүхэд' }) {
  const [homeworkContext, setHomeworkContext] = useState('')

  return (
    <div className="session-layout">
      {/* LEFT 30% */}
      <div className="session-left">
        <div className="session-homework">
          <HomeworkUpload onHomeworkLoaded={setHomeworkContext} />
        </div>
        <div className="session-camera">
          <StudentCamera />
        </div>
      </div>

      {/* RIGHT 70% */}
      <div className="session-right">
        <TutorAvatar nickname={nickname} homeworkContext={homeworkContext} />
      </div>
    </div>
  )
}
