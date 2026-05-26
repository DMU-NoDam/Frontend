import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LuX } from 'react-icons/lu'
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
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await apiClient.patch('/user/api', { name: name.trim() })
      updateUser({ name: name.trim() })
      onClose()
    } catch {
      // 실패 시 시트 유지
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setName(user?.name ?? '')
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
            initial={{ opacity: 0, x: '-50%', y: 'calc(-50% - 12px)' }}
            animate={{ opacity: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0,    x: '-50%', y: 'calc(-50% - 12px)' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className="pes-header">
              <span className="pes-header__title">닉네임 변경</span>
              <button type="button" className="pes-header__close" onClick={handleClose} aria-label="닫기">
                <LuX />
              </button>
            </div>

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
