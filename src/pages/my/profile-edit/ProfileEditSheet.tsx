import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LuCamera, LuX } from 'react-icons/lu'
import { useAuthStore } from '@/app/store/auth-store'
import { apiClient } from '@/shared/api/client'
import './ProfileEditSheet.css'

type Props = {
  open: boolean
  onClose: () => void
}

export function ProfileEditSheet({ open, onClose }: Props) {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)

  const [name, setName] = useState(user?.name ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await apiClient.patch('/user/api', { name: name.trim() })
      updateUser({ name: name.trim() })
      onClose()
    } catch {
      // 실패 시 그냥 닫지 않고 유지
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setName(user?.name ?? '')
    setAvatarPreview(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="pes-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          <motion.div
            className="pes-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* 핸들 */}
            <div className="pes-handle" />

            {/* 헤더 */}
            <div className="pes-header">
              <span className="pes-header__title">프로필 편집</span>
              <button type="button" className="pes-header__close" onClick={handleClose} aria-label="닫기">
                <LuX />
              </button>
            </div>

            {/* 프로필 사진 */}
            <div className="pes-avatar-wrap">
              <div className="pes-avatar">
                {avatarPreview
                  ? <img src={avatarPreview} alt="프로필" className="pes-avatar__img" />
                  : <span className="pes-avatar__placeholder">{name.charAt(0) || '?'}</span>
                }
                <button
                  type="button"
                  className="pes-avatar__edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="사진 변경"
                >
                  <LuCamera />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="pes-file-input"
                onChange={handleFileChange}
              />
              <p className="pes-avatar__hint">사진 변경</p>
            </div>

            {/* 닉네임 입력 */}
            <div className="pes-field">
              <label className="pes-field__label" htmlFor="pes-name">닉네임</label>
              <input
                id="pes-name"
                type="text"
                className="pes-field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {/* 저장 버튼 */}
            <button
              type="button"
              className="pes-save-btn"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
