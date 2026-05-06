// Stubbed auth for local-only mode. Single implicit user.
const LOCAL_USER = {
  id: 'local-user',
  email: 'local@localhost',
  full_name: 'Local User',
  role: 'admin',
};

export const auth = {
  async me() {
    return LOCAL_USER;
  },
  logout() {},
  redirectToLogin() {},
};
