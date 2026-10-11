import api from './axios'

// All REST calls in one place, grouped by resource
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  // Multipart upload; the browser sets the boundary in the Content-Type header itself
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.put('/auth/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  removeAvatar: () => api.delete('/auth/me/avatar'),
}

export const bookApi = {
  list: (params) => api.get('/books', { params }),
  categories: () => api.get('/books/categories'),
  get: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  remove: (id) => api.delete(`/books/${id}`),
}

export const borrowApi = {
  request: (bookId, notes) => api.post('/borrows', { bookId, notes }),
  mine: (params) => api.get('/borrows/my', { params }),
  cancel: (id) => api.put(`/borrows/${id}/cancel`),
  list: (params) => api.get('/borrows', { params }),
  approve: (id) => api.put(`/borrows/${id}/approve`),
  reject: (id, notes) => api.put(`/borrows/${id}/reject`, { notes }),
  markReturned: (id) => api.put(`/borrows/${id}/return`),
  remove: (id) => api.delete(`/borrows/${id}`),
}

export const userApi = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
}

export const statsApi = {
  admin: () => api.get('/stats/admin'),
  me: () => api.get('/stats/me'),
}
