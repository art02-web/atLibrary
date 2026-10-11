import { useEffect, useRef, useState } from 'react'
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/services'
import { errorMessage } from '../api/axios'
import { formatDate, nameParts } from '../utils/format'
import { AVATAR_TYPES, avatarError, nameError, passwordError, phoneError } from '../utils/validators'
import PageHeader from '../components/PageHeader'
import Notice from '../components/Notice'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import Avatar from '../components/Avatar'

export default function Profile() {
  const { user, setUser, saveSession } = useAuth()
  const [form, setForm] = useState({
    ...nameParts(user), studentId: user.studentId || '', phone: user.phone || '', address: user.address || '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaving, setPwSaving] = useState(false)

  // Profile picture: pick -> preview -> save, or remove the current one
  const fileInput = useRef(null)
  const [picture, setPicture] = useState(null) // { file, preview }
  const [pictureBusy, setPictureBusy] = useState(false)
  // Results are shown in place, under each section (no pop-ups): { variant, message }
  const [pictureMsg, setPictureMsg] = useState(null)
  const [profileMsg, setProfileMsg] = useState(null)
  const [pwMsg, setPwMsg] = useState(null)
  useEffect(() => () => picture && URL.revokeObjectURL(picture.preview), [picture])

  const choosePicture = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be picked again
    if (!file) return
    setPictureMsg(null)
    const err = avatarError(file)
    if (err) return setPictureMsg({ variant: 'danger', message: err })
    setPicture({ file, preview: URL.createObjectURL(file) })
  }

  const savePicture = async () => {
    setPictureBusy(true)
    try {
      const { data } = await authApi.uploadAvatar(picture.file)
      setUser(data.user)
      setPicture(null)
      setPictureMsg(null)
    } catch (err) {
      setPictureMsg({ variant: 'danger', message: errorMessage(err) })
    } finally {
      setPictureBusy(false)
    }
  }

  const removePicture = async () => {
    setPictureBusy(true)
    try {
      const { data } = await authApi.removeAvatar()
      setUser(data.user)
      setPictureMsg(null)
    } catch (err) {
      setPictureMsg({ variant: 'danger', message: errorMessage(err) })
    } finally {
      setPictureBusy(false)
    }
  }

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setProfileMsg(null)
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const errs = {}
    // Older accounts may have a first name that predates the letters-only rule: only check it when it changes
    const firstChanged = form.firstName.trim() !== nameParts(user).firstName
    const fn = firstChanged ? nameError(form.firstName, 'First name') : ''
    if (fn) errs.firstName = fn
    const ln = nameError(form.lastName, 'Last name')
    if (ln) errs.lastName = ln
    const ph = phoneError(form.phone)
    if (ph) errs.phone = ph
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    setProfileMsg(null)
    try {
      const payload = { ...form }
      if (!firstChanged) delete payload.firstName
      const { data } = await authApi.updateMe(payload)
      setUser(data.user)
      setProfileMsg({ variant: 'success', message: 'Saved' })
    } catch (err) {
      setProfileMsg({ variant: 'danger', message: errorMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!pw.currentPassword) errs.currentPassword = 'Current password is required'
    const np = passwordError(pw.newPassword)
    if (np) errs.newPassword = np
    if (pw.confirm !== pw.newPassword) errs.confirm = 'Passwords do not match'
    setPwErrors(errs)
    if (Object.keys(errs).length) return

    setPwSaving(true)
    setPwMsg(null)
    try {
      const { data } = await authApi.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      saveSession(data.token, user)
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setPwMsg({ variant: 'success', message: 'Password changed' })
    } catch (err) {
      setPwMsg({ variant: 'danger', message: errorMessage(err) })
    } finally {
      setPwSaving(false)
    }
  }

  const pwField = (name, label, extra) => (
    <Form.Group className="mb-3" controlId={name}>
      <Form.Label className="small fw-medium">{label}</Form.Label>
      <PasswordInput
        name={name} value={pw[name]} isInvalid={!!pwErrors[name]} error={pwErrors[name]}
        onChange={(e) => { setPw({ ...pw, [name]: e.target.value }); setPwErrors({ ...pwErrors, [name]: '' }); setPwMsg(null) }}
        autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
      />
      {extra}
    </Form.Group>
  )

  return (
    <>
      <PageHeader title="My Profile" subtitle="Manage your personal information and password." />
      <Row className="g-4">
        <Col lg={4}>
          <div className="at-card p-4 text-center h-100">
            <Avatar user={user} src={picture?.preview} size="lg" className="mx-auto mb-3" />
            <input ref={fileInput} type="file" accept={AVATAR_TYPES.join(',')} className="d-none" onChange={choosePicture} />
            <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
              {picture ? (
                <>
                  <Button size="sm" onClick={savePicture} disabled={pictureBusy}>
                    {pictureBusy ? <Spinner size="sm" /> : 'Save picture'}
                  </Button>
                  <Button size="sm" variant="light" onClick={() => setPicture(null)} disabled={pictureBusy}>Cancel</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="light" onClick={() => fileInput.current.click()} disabled={pictureBusy}>
                    <i className="bi bi-camera me-1" />{user.avatarUrl ? 'Change picture' : 'Upload picture'}
                  </Button>
                  {user.avatarUrl && (
                    <Button size="sm" variant="link" className="text-danger" onClick={removePicture} disabled={pictureBusy}>
                      Remove picture
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="text-muted small mb-3">JPG, PNG or WEBP, up to 2 MB</div>
            <Notice message={pictureMsg?.message} variant={pictureMsg?.variant} className="text-start" />
            <h5 className="fw-bold mb-0 text-truncate" title={user.name}>{user.name}</h5>
            <div className="text-muted small mb-2">{user.email}</div>
            <span className={`badge rounded-pill ${user.role === 'admin' ? 'bg-secondary' : 'bg-primary'} text-capitalize`}>
              {user.role}
            </span>
            <hr />
            <ul className="list-unstyled text-start small mb-0 d-grid gap-2">
              <li><i className="bi bi-person-vcard me-2 text-muted" />{user.studentId || 'No student ID'}</li>
              <li><i className="bi bi-telephone me-2 text-muted" />{user.phone || 'No phone number'}</li>
              <li><i className="bi bi-geo-alt me-2 text-muted" />{user.address || 'No address'}</li>
              <li><i className="bi bi-calendar3 me-2 text-muted" />Member since {formatDate(user.createdAt)}</li>
            </ul>
          </div>
        </Col>
        <Col lg={8}>
          <div className="at-card p-4 mb-4">
            <h6 className="fw-bold mb-3"><i className="bi bi-pencil-square me-2" />Edit profile</h6>
            <Form noValidate onSubmit={saveProfile}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="firstName">
                    <Form.Label className="small fw-medium">First name</Form.Label>
                    <Form.Control name="firstName" value={form.firstName} onChange={onChange} isInvalid={!!errors.firstName} maxLength={30} />
                    <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="lastName">
                    <Form.Label className="small fw-medium">Last name</Form.Label>
                    <Form.Control name="lastName" value={form.lastName} onChange={onChange} isInvalid={!!errors.lastName} maxLength={30} />
                    <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="emailRO">
                    <Form.Label className="small fw-medium">Email</Form.Label>
                    <Form.Control value={user.email} disabled readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="studentId">
                    <Form.Label className="small fw-medium">Student / Employee ID</Form.Label>
                    <Form.Control name="studentId" value={form.studentId} onChange={onChange} maxLength={30} />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3" controlId="phone">
                    <Form.Label className="small fw-medium">Phone</Form.Label>
                    <Form.Control name="phone" value={form.phone} onChange={onChange} isInvalid={!!errors.phone} placeholder="09XX XXX XXXX" />
                    <Form.Control.Feedback type="invalid">{errors.phone}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group className="mb-3" controlId="address">
                    <Form.Label className="small fw-medium">Address</Form.Label>
                    <Form.Control name="address" value={form.address} onChange={onChange} maxLength={200} />
                  </Form.Group>
                </Col>
              </Row>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner size="sm" className="me-2" />}Save changes
              </Button>
              <Notice message={profileMsg?.message} variant={profileMsg?.variant} className="mt-3 mb-0" />
            </Form>
          </div>

          <div className="at-card p-4">
            <h6 className="fw-bold mb-3"><i className="bi bi-key me-2" />Change password</h6>
            <Form noValidate onSubmit={changePassword}>
              <Row>
                <Col md={12}>{pwField('currentPassword', 'Current password')}</Col>
                <Col md={6}>{pwField('newPassword', 'New password', <PasswordStrength value={pw.newPassword} />)}</Col>
                <Col md={6}>{pwField('confirm', 'Confirm new password')}</Col>
              </Row>
              <Button type="submit" variant="outline-primary" disabled={pwSaving}>
                {pwSaving && <Spinner size="sm" className="me-2" />}Update password
              </Button>
              <Notice message={pwMsg?.message} variant={pwMsg?.variant} className="mt-3 mb-0" />
            </Form>
          </div>
        </Col>
      </Row>
    </>
  )
}
