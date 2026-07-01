import { useState } from 'react'
import AvatarPicker from '../AvatarPicker.tsx'
import { HomeworkUpload } from './HomeworkUpload.jsx'
import { StudentCamera } from './StudentCamera.jsx'
import { TutorAvatar } from './TutorAvatar.jsx'
import './avatar.css'

export function AvatarSession({ nickname = 'хүүхэд', avatar = 'sun-buddy', sessionCode }) {
  const [homeworkContext, setHomeworkContext] = useState('')
  const [problems, setProblems] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(avatar)
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false)

  const handleHomeworkLoaded = (context, problemList = []) => {
    setHomeworkContext(context)
    setProblems(problemList)
  }

  const handleSelectAvatar = (id) => {
    setSelectedAvatar(id)
    window.sessionStorage.setItem('selectedAvatar', id)
    setAvatarPickerOpen(false)
  }

  return (
    <>
      <div className="session-layout">
        <button
          type="button"
          className="session-avatar-btn"
          onClick={() => setAvatarPickerOpen(true)}
          aria-label="Avatar сонгох"
        >
          Avatar
        </button>

        {/* LEFT 30% */}
        <div className="session-left">
          <div className="session-homework">
            <HomeworkUpload onHomeworkLoaded={handleHomeworkLoaded} onAnalyzingChange={setAnalyzing} />
          </div>
          <div className="session-camera">
            <StudentCamera sessionCode={sessionCode} />
          </div>
        </div>

        {/* RIGHT 70% */}
        <div className="session-right">
          <TutorAvatar nickname={nickname} homeworkContext={homeworkContext} problems={problems} analyzing={analyzing} avatar={selectedAvatar} />
        </div>
      </div>

      {avatarPickerOpen && (
        <AvatarPicker
          selected={selectedAvatar}
          onSelect={handleSelectAvatar}
          onClose={() => setAvatarPickerOpen(false)}
        />
      )}
    </>
  )
}
