import React, { useState, useEffect, useRef } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
  CProgressBar,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPhone, cilLockLocked, cilCloudUpload, cilCheckCircle } from '@coreui/icons'

// Custom File Upload Component for better UX
const CustomFileUpload = ({ label, name, value, onFileChange }) => (
  <div className="mb-4">
    <label className="form-label fw-semibold">{label}</label>
    <div 
      className={`position-relative p-3 text-center border rounded-3 transition-all ${value ? 'border-success bg-light' : 'border-dashed border-secondary-subtle'}`}
      style={{ 
        borderStyle: value ? 'solid' : 'dashed', 
        borderWidth: '2px',
        cursor: 'pointer',
        transition: '0.3s'
      }}
      onClick={() => document.getElementById(name).click()}
    >
      <input 
        id={name}
        type="file" 
        name={name} 
        accept="image/*,application/pdf"
        capture="environment"
        className="position-absolute opacity-0 top-0 start-0 w-100 h-100" 
        style={{ cursor: 'pointer', zIndex: 2 }}
        onChange={onFileChange} 
        required 
      />
      <div className="d-flex flex-column align-items-center justify-content-center">
        {value ? (
          <>
            <CIcon icon={cilCheckCircle} className="text-success mb-2" size="xl" />
            <span className="text-success fw-medium">{value.name}</span>
            <small className="text-body-secondary">اضغط للتغيير</small>
          </>
        ) : (
          <>
            <CIcon icon={cilCloudUpload} className="text-secondary mb-2" size="xl" />
            <span className="text-body-secondary">التقط صورة أو ارفع الملف هنا</span>
          </>
        )}
      </div>
    </div>
  </div>
)

// OTP Square Input Component
const OTPInput = ({ otp, setOtp, onComplete }) => {
  const inputRefs = useRef([])

  const handleChange = (e, index) => {
    const value = e.target.value.slice(-1) // Only take the last character
    if (!/^\d*$/.test(value)) return // Only allow numbers

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Move to next input
    if (value && index < 3) {
      inputRefs.current[index + 1].focus()
    }

    if (newOtp.every(v => v !== '')) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  return (
    <div className="d-flex justify-content-center gap-3 mb-4" dir="ltr">
      {[0, 1, 2, 3].map((index) => (
        <CFormInput
          key={index}
          ref={el => inputRefs.current[index] = el}
          type="text"
          className="text-center fw-bold"
          style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}
          value={otp[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          maxLength={1}
        />
      ))}
    </div>
  )
}

const ProviderRegister = () => {
  const [step, setStep] = useState(1)
  const [timer, setTimer] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    countryCode: '+966',
    phoneNumber: '',
    otp: Array(4).fill(''),
    otpString: '',
    password: '',
    confirmPassword: '',
    idFront: null,
    idBack: null,
    criminalRecord: null,
    drugTest: null,
  })

  useEffect(() => {
    let interval
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const setFieldError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }

  const clearErrors = () => setErrors({})

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    setFormData((prev) => ({ ...prev, [name]: files[0] }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validatePhone = (phone, countryCode) => {
    // Remove leading zero if present
    const cleanPhone = phone.startsWith('0') ? phone.substring(1) : phone
    
    if (countryCode === '+966') {
      // Saudi: should be 9 digits starting with 5
      return /^5\d{8}$/.test(cleanPhone)
    }
    
    // Generic validation for other countries: 7 to 15 digits
    return /^\d{7,15}$/.test(cleanPhone)
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    clearErrors()
    
    if (!formData.phoneNumber) {
      setFieldError('phoneNumber', 'يرجى إدخال رقم الهاتف')
      return
    }
    if (!validatePhone(formData.phoneNumber, formData.countryCode)) {
      setFieldError('phoneNumber', 'يرجى إدخال رقم هاتف صحيح')
      return
    }

    setIsLoading(true)
    // TODO: LINK WITH BACKEND
    // Endpoint: POST /api/auth/request-otp
    console.log('Requesting OTP for:', formData.phoneNumber)
    
    setTimeout(() => {
      setIsLoading(false)
      setTimer(60)
      setStep(2)
    }, 1500)
  }

  const handleResendOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: LINK WITH BACKEND
    console.log('Resending OTP for:', formData.phoneNumber)
    
    setTimeout(() => {
      setIsLoading(false)
      setTimer(60)
      alert('تم إرسال رمز التحقق مرة أخرى')
    }, 1000)
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    clearErrors()
    
    if (formData.otpString.length < 4) {
      setFieldError('otp', 'يرجى إدخال رمز التحقق المكون من 4 أرقام')
      return
    }

    setIsLoading(true)
    // TODO: LINK WITH BACKEND
    // Endpoint: POST /api/auth/verify-otp
    console.log('Verifying OTP:', formData.otpString)
    
    setTimeout(() => {
      setIsLoading(false)
      setStep(3)
    }, 1500)
  }

  const handlePasswordStep = async (e) => {
    e.preventDefault()
    clearErrors()
    
    if (formData.password.length < 8) {
      setFieldError('password', 'يجب أن تكون كلمة المرور 8 أحرف على الأقل')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', 'كلمات المرور غير متطابقة')
      return
    }
    
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStep(4)
    }, 1000)
  }

  const handleCompleteRegistration = async (e) => {
    e.preventDefault()
    clearErrors()
    
    const missingFields = []
    if (!formData.idFront) missingFields.push('الهوية الوطنية (الوجه الأمامي)')
    if (!formData.idBack) missingFields.push('الهوية الوطنية (الوجه الخلفي)')
    if (!formData.criminalRecord) missingFields.push('صحيفة الحالة الجنائية')
    if (!formData.drugTest) missingFields.push('فحص المخدرات')

    if (missingFields.length > 0) {
      alert(`يرجى تحميل: ${missingFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    // TODO: LINK WITH BACKEND
    // Endpoint: POST /api/providers/register
    
    const data = new FormData()
    data.append('phoneNumber', formData.phoneNumber)
    data.append('password', formData.password)
    data.append('idFront', formData.idFront)
    data.append('idBack', formData.idBack)
    data.append('criminalRecord', formData.criminalRecord)
    data.append('drugTest', formData.drugTest)
    
    console.log('Submitting registration data...')
    
    setTimeout(() => {
      setIsLoading(false)
      alert('تم تقديم طلب التسجيل بنجاح!')
    }, 2000)
  }

  const progress = (step / 4) * 100

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center" dir="rtl">
      <style>
        {`
          .custom-progress-bar .progress-bar {
            transition: width 0.6s cubic-bezier(0.65, 0, 0.35, 1) !important;
          }
          .rtl-select {
            text-align: right !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M10 4l-4 4-4-4h3v4h2v-4h3z'/%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: left 0.75rem center !important;
            padding-left: 2rem !important;
            padding-right: 0.75rem !important;
          }
        `}
      </style>
      <CContainer>
        <CRow className="justify-content-center">
          <CCol xs={12} md={9} lg={7} xl={6}>
            <CCard className="mx-auto shadow-sm border-0">
              <CCardBody className="p-4 p-md-5">
                <CForm>
                  <div className="text-center mb-4">
                    <h2 className="fw-bold">تسجيل مزود خدمة</h2>
                    <p className="text-body-secondary">خطوة {step} من 4</p>
                    <div className="mt-3">
                      <CProgressBar 
                        animated 
                        value={progress} 
                        className="mb-3 custom-progress-bar" 
                        style={{ height: '8px' }} 
                      />
                    </div>
                  </div>

                  {step === 1 && (
                    <div className="step-1 text-center">
                      <p className="mb-4">أدخل رقم هاتفك لتلقي رمز التحقق</p>
                      <CInputGroup className="mb-2">
                        <CFormSelect 
                          name="countryCode" 
                          value={formData.countryCode} 
                          onChange={handleInputChange}
                          style={{ maxWidth: '140px' }}
                          className="rtl-select"
                          dir="rtl"
                        >
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+965">🇰🇼 +965</option>
                          <option value="+968">🇴🇲 +968</option>
                          <option value="+973">🇧🇭 +973</option>
                          <option value="+20">🇪🇬 +20</option>
                          <option value="+962">🇯🇴 +962</option>
                        </CFormSelect>
                        <CInputGroupText>
                          <CIcon icon={cilPhone} />
                        </CInputGroupText>
                        <CFormInput 
                          name="phoneNumber"
                          type="tel" 
                          placeholder="رقم الهاتف" 
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required 
                          className={`text-start ${errors.phoneNumber ? 'is-invalid' : ''}`}
                          dir="ltr"
                        />
                      </CInputGroup>
                      {errors.phoneNumber && (
                        <div className="text-danger small text-end mb-3">{errors.phoneNumber}</div>
                      )}
                      <div className="d-grid mt-4">
                        <CButton color="primary" size="lg" onClick={handleSendOTP} disabled={isLoading}>
                          {isLoading ? <CSpinner size="sm" /> : 'إرسال رمز التحقق'}
                        </CButton>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="step-2 text-center">
                      <p className="mb-4">أدخل رمز التحقق المرسل إلى {formData.phoneNumber}</p>
                      <div className="mb-2">
                        <OTPInput 
                          otp={formData.otp} 
                          setOtp={(val) => setFormData(p => ({ ...p, otp: val }))}
                          onComplete={(val) => setFormData(p => ({ ...p, otpString: val }))}
                        />
                      </div>
                      {errors.otp && (
                        <div className="text-danger small mb-3">{errors.otp}</div>
                      )}
                      <div className="d-grid gap-2">
                        <CButton color="primary" size="lg" onClick={handleVerifyOTP} disabled={isLoading}>
                          {isLoading ? <CSpinner size="sm" /> : 'تحقق الآن'}
                        </CButton>
                        <div className="mt-3">
                          {timer > 0 ? (
                            <span className="text-body-secondary">
                              يمكنك إعادة إرسال الرمز بعد {timer} ثانية
                            </span>
                          ) : (
                            <CButton color="link" onClick={handleResendOTP} disabled={isLoading}>
                              {isLoading ? <CSpinner size="sm" /> : 'إعادة إرسال رمز التحقق'}
                            </CButton>
                          )}
                        </div>
                        <CButton color="secondary" variant="ghost" onClick={() => setStep(1)} className="mt-2">
                          تغيير رقم الهاتف
                        </CButton>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="step-3">
                      <p className="mb-4 text-center">يرجى تعيين كلمة مرور قوية لحسابك</p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput 
                          name="password"
                          type="password" 
                          placeholder="كلمة المرور" 
                          value={formData.password}
                          onChange={handleInputChange}
                          required 
                          dir="ltr"
                          className={`text-start ${errors.password ? 'is-invalid' : ''}`}
                        />
                      </CInputGroup>
                      {errors.password && (
                        <div className="text-danger small mb-3 text-end">{errors.password}</div>
                      )}
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput 
                          name="confirmPassword"
                          type="password" 
                          placeholder="تأكيد كلمة المرور" 
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required 
                          dir="ltr"
                          className={`text-start ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        />
                      </CInputGroup>
                      {errors.confirmPassword && (
                        <div className="text-danger small mb-3 text-end">{errors.confirmPassword}</div>
                      )}
                      <div className="d-grid gap-2">
                        <CButton color="primary" size="lg" onClick={handlePasswordStep} disabled={isLoading}>
                          {isLoading ? <CSpinner size="sm" /> : 'التالي'}
                        </CButton>
                        <CButton color="secondary" variant="ghost" onClick={() => setStep(2)} className="mt-2">
                          العودة للتحقق
                        </CButton>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="step-4">
                      <p className="mb-4 text-center">يرجى تحميل المستندات المطلوبة لإكمال التسجيل</p>
                      
                      <CustomFileUpload 
                        label="الهوية الوطنية (الوجه الأمامي)" 
                        name="idFront" 
                        value={formData.idFront} 
                        onFileChange={handleFileChange}
                      />
                      <CustomFileUpload 
                        label="الهوية الوطنية (الوجه الخلفي)" 
                        name="idBack" 
                        value={formData.idBack} 
                        onFileChange={handleFileChange}
                      />
                      <CustomFileUpload 
                        label="صحيفة الحالة الجنائية" 
                        name="criminalRecord" 
                        value={formData.criminalRecord} 
                        onFileChange={handleFileChange}
                      />
                      <CustomFileUpload 
                        label="نسخة من فحص المخدرات" 
                        name="drugTest" 
                        value={formData.drugTest} 
                        onFileChange={handleFileChange}
                      />

                      <div className="d-grid gap-2">
                        <CButton color="success" size="lg" onClick={handleCompleteRegistration} disabled={isLoading}>
                          {isLoading ? <CSpinner size="sm" /> : 'إكمال التسجيل'}
                        </CButton>
                        <CButton color="secondary" variant="ghost" onClick={() => setStep(3)} className="mt-2">
                          العودة لتعيين كلمة المرور
                        </CButton>
                      </div>
                    </div>
                  )}
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default ProviderRegister
