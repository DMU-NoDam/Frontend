import { AnimatePresence, motion } from 'framer-motion'
import { LuX } from 'react-icons/lu'
import './PrivacyPolicy.css'

type Props = {
  open: boolean
  onClose: () => void
}

export function PrivacyPolicyModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="privacy-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="privacy-modal"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="privacy-modal__header">
              <h2 className="privacy-modal__title">개인정보처리방침</h2>
              <button
                type="button"
                className="privacy-modal__close"
                onClick={onClose}
                aria-label="닫기"
              >
                <LuX />
              </button>
            </div>

            <div className="privacy-modal__body">
              <p className="privacy-modal__updated">최종 업데이트: 2025년 5월</p>

              <h3 className="privacy-modal__section">1. 수집하는 개인정보 항목</h3>
              <p>서비스 이용 시 아래 정보를 수집합니다.</p>
              <ul>
                <li>소셜 로그인(네이버·카카오·구글)을 통한 이름, 이메일 주소</li>
                <li>서비스 이용 과정에서 생성된 여행 일정 및 방문 기록</li>
                <li>서비스 접속 기록, 기기 정보 (자동 수집)</li>
              </ul>

              <h3 className="privacy-modal__section">2. 개인정보 수집 및 이용 목적</h3>
              <ul>
                <li>회원 식별 및 서비스 제공</li>
                <li>여행 일정 저장·조회·관리</li>
                <li>서비스 개선 및 통계 분석</li>
              </ul>

              <h3 className="privacy-modal__section">3. 개인정보 보유 및 이용 기간</h3>
              <p>
                회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우
                해당 기간 동안 보관합니다.
              </p>

              <h3 className="privacy-modal__section">4. 개인정보 제3자 제공</h3>
              <p>
                이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
                소셜 로그인 제공자(네이버·카카오·구글)의 정책에 따라 인증 정보가 처리됩니다.
              </p>

              <h3 className="privacy-modal__section">5. 이용자의 권리</h3>
              <p>
                이용자는 언제든지 개인정보 열람, 수정, 삭제를 요청할 수 있으며
                회원 탈퇴를 통해 개인정보 처리에 동의를 철회할 수 있습니다.
              </p>

              <h3 className="privacy-modal__section">6. 개인정보 보호책임자</h3>
              <p>이메일: alsehgus2019@gmail.com</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
