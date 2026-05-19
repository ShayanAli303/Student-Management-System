import { useEffect, useMemo, useRef, useState } from "react";

import DataTable from "./components/DataTable";
import AttendanceDonut from "./components/AttendanceDonut";
import FormModal from "./components/FormModal";
import Sidebar from "./components/Sidebar";
import SummaryCards from "./components/SummaryCards";
import { api } from "./lib/api";

const roleConfig = {
  student: { label: "Student Login", forgotEnabled: true },
  teacher: { label: "Teacher Login", forgotEnabled: true },
  admin: { label: "Admin Login", forgotEnabled: false },
};

const statusOptions = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
];

const feeStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function buildTeacherFields() {
  return [
    { name: "username", label: "Username", required: true },
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
    { name: "email", label: "Email", type: "email" },
    { name: "employee_id", label: "Employee ID", required: true },
    { name: "department", label: "Department" },
    { name: "phone", label: "Phone" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "plain_password", label: "Password" },
  ];
}

function buildStudentFields(classOptions) {
  return [
    { name: "username", label: "Username", required: true },
    { name: "first_name", label: "First Name" },
    { name: "last_name", label: "Last Name" },
    { name: "email", label: "Email", type: "email" },
    { name: "admission_number", label: "Admission Number", required: true },
    { name: "guardian_name", label: "Guardian Name" },
    { name: "phone", label: "Phone" },
    { name: "date_of_birth", label: "Date of Birth", type: "date" },
    { name: "school_class", label: "Class", type: "select", options: classOptions },
    { name: "address", label: "Address", type: "textarea" },
    { name: "plain_password", label: "Password" },
  ];
}

function buildClassFields(teacherOptions) {
  return [
    { name: "name", label: "Class Name", required: true },
    { name: "section", label: "Section", required: true },
    { name: "room", label: "Room" },
    { name: "schedule", label: "Schedule" },
    { name: "teacher", label: "Teacher", type: "select", options: teacherOptions },
    { name: "description", label: "Description", type: "textarea" },
  ];
}

function buildFeeFields(studentOptions) {
  return [
    { name: "student", label: "Student", type: "select", options: studentOptions, required: true },
    { name: "title", label: "Title", required: true },
    { name: "amount", label: "Amount", type: "number", required: true },
    { name: "amount_paid", label: "Amount Paid", type: "number", required: true, defaultValue: 0 },
    { name: "due_date", label: "Due Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: feeStatusOptions, required: true },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
}

function buildAttendanceFields(classOptions, studentOptions) {
  return [
    { name: "school_class", label: "Class", type: "select", options: classOptions, required: true },
    {
      name: "student",
      label: "Student",
      type: "select",
      options: studentOptions,
      required: true,
      filterOptions: (formState) => {
        const selectedClassId = Number(formState.school_class);
        return selectedClassId ? studentOptions.filter((student) => student.classId === selectedClassId) : studentOptions;
      },
    },
    { name: "date", label: "Date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    { name: "remarks", label: "Remarks" },
  ];
}

function buildGradeFields(classOptions, studentOptions) {
  return [
    { name: "school_class", label: "Class", type: "select", options: classOptions, required: true },
    {
      name: "student",
      label: "Student",
      type: "select",
      options: studentOptions,
      required: true,
      filterOptions: (formState) => {
        const selectedClassId = Number(formState.school_class);
        return selectedClassId ? studentOptions.filter((student) => student.classId === selectedClassId) : studentOptions;
      },
    },
    { name: "subject", label: "Subject", required: true },
    { name: "exam_name", label: "Exam Name", required: true },
    { name: "score", label: "Score", type: "number", required: true },
    { name: "max_score", label: "Max Score", type: "number", required: true, defaultValue: 100 },
    { name: "remarks", label: "Remarks" },
  ];
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="panel-section">
      <div className="section-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>{title}</h2>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelCard({ children }) {
  return <div className="panel-card">{children}</div>;
}

function ThemeIcon({ theme }) {
  return <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>;
}

function LoginScreen({ onLogin, theme, onToggleTheme }) {
  const [role, setRole] = useState("student");
  const [formState, setFormState] = useState({ username: "", password: "" });
  const [forgotUsername, setForgotUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await onLogin({ ...formState, role });
    } catch (submissionError) {
      setError(submissionError.message);
    }
  };

  const submitForgotPassword = async () => {
    setError("");
    setMessage("");
    try {
      const data = await api.post("/api/auth/forgot-password/", { username: forgotUsername, role });
      setMessage(data.detail);
      window.alert(data.detail);
      setForgotUsername("");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <div className="login-shell">
      <button className="icon-toggle login-theme-toggle" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
        <ThemeIcon theme={theme} />
      </button>
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <div className="login-grid" />
      <div className="login-card">
        <div className="logo-lockup">
          <div className="logo-mark">
            <span>SMS</span>
          </div>
          <div className="logo-copy">
            <p className="eyebrow">Student Management System</p>
            <h1>{roleConfig[role].label}</h1>
            <span>Unified academic records, attendance, grades, fees, and secure role-based access.</span>
          </div>
        </div>
        <div className="role-switcher centered">
          {Object.entries(roleConfig).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={role === key ? "role-button active" : "role-button"}
              onClick={() => {
                setRole(key);
                setError("");
                setMessage("");
              }}
            >
              {config.label.replace(" Login", "")}
            </button>
          ))}
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              value={formState.username}
              onChange={(event) => setFormState((current) => ({ ...current, username: event.target.value }))}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
              required
            />
          </label>
          {error ? <p className="feedback error">{error}</p> : null}
          {message ? <p className="feedback success">{message}</p> : null}
          <button className="primary-button full-width" type="submit">
            Sign In
          </button>
        </form>
        {roleConfig[role].forgotEnabled ? (
          <div className="forgot-box">
            <h3>Forgot Password?</h3>
            <div className="forgot-row">
              <input
                placeholder={`Enter ${role} username`}
                value={forgotUsername}
                onChange={(event) => setForgotUsername(event.target.value)}
              />
              <button className="secondary-button" type="button" onClick={submitForgotPassword} disabled={!forgotUsername}>
                Request
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DashboardShell({ user, items, active, onChange, onLogout, children, theme, onToggleTheme }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="mobile-topbar">
        <button className="icon-toggle" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          ≡
        </button>
        <div className="mobile-topbar-copy">
          <strong>SMS Control</strong>
          <span>{user.full_name}</span>
        </div>
      </header>
      <Sidebar
        items={items}
        active={active}
        onChange={onChange}
        user={user}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AdminDashboard({ user, refreshToken, onLogout, notify, theme, onToggleTheme }) {
  const [active, setActive] = useState("overview");
  const [state, setState] = useState({
    dashboard: null,
    meta: { teachers: [], students: [], classes: [] },
    teachers: [],
    students: [],
    classes: [],
    fees: [],
    requests: [],
    passwords: { teachers: [], students: [] },
  });
  const [modal, setModal] = useState(null);
  const [passwordRole, setPasswordRole] = useState("teachers");

  const loadData = async () => {
    const [dashboard, meta, teachers, students, classes, fees, requests, passwords] = await Promise.all([
      api.get("/api/admin-panel/dashboard/"),
      api.get("/api/admin-panel/meta/"),
      api.get("/api/admin-panel/teachers/"),
      api.get("/api/admin-panel/students/"),
      api.get("/api/admin-panel/classes/"),
      api.get("/api/admin-panel/fees/"),
      api.get("/api/admin-panel/password-requests/"),
      api.get("/api/admin/password-catalog/"),
    ]);
    setState({ dashboard, meta, teachers, students, classes, fees, requests, passwords });
  };

  useEffect(() => {
    loadData().catch((error) => notify(error.message, "error"));
  }, [refreshToken]);

  const teacherOptions = useMemo(
    () => state.meta.teachers.map((teacher) => ({ value: teacher.id, label: `${teacher.user_full_name} (${teacher.employee_id})` })),
    [state.meta.teachers],
  );
  const studentOptions = useMemo(
    () => state.meta.students.map((student) => ({ value: student.id, label: `${student.user_full_name} (${student.admission_number})` })),
    [state.meta.students],
  );
  const classOptions = useMemo(
    () => state.meta.classes.map((schoolClass) => ({ value: schoolClass.id, label: `${schoolClass.name} - ${schoolClass.section}` })),
    [state.meta.classes],
  );

  const openCrudModal = (config) => setModal(config);
  const closeModal = () => setModal(null);

  const saveCrudRecord = async (endpoint, method, payload, id) => {
    const url = id ? `${endpoint}${id}/` : endpoint;
    const requestMethod = method === "create" ? api.post : api.put;
    await requestMethod(url, payload);
    await loadData();
    closeModal();
    notify("Changes saved successfully.", "success");
  };

  const deleteCrudRecord = async (endpoint, id) => {
    if (!window.confirm("Delete this record?")) {
      return;
    }
    try {
      await api.delete(`${endpoint}${id}/`);
      await loadData();
      notify("Record deleted.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = window.prompt("Enter a new password:");
    if (!newPassword) {
      return;
    }
    try {
      await api.post("/api/admin/reset-password/", { user_id: userId, new_password: newPassword });
      await loadData();
      notify("Password reset completed.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const resolveRequest = async (id) => {
    try {
      await api.post(`/api/admin-panel/password-requests/${id}/resolve/`, {});
      await loadData();
      notify("Request marked as resolved.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Students" },
    { key: "teachers", label: "Teachers" },
    { key: "classes", label: "Classes" },
    { key: "fees", label: "Fees" },
    { key: "passwords", label: "Passwords" },
    { key: "requests", label: "Requests" },
  ];

  return (
    <DashboardShell
      user={user}
      items={navItems}
      active={active}
      onChange={setActive}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      {active === "overview" && state.dashboard ? (
        <>
          <Section title="Admin Dashboard" subtitle="System-wide control across academic records, fees, and security.">
            <SummaryCards
              items={[
                { label: "Students", value: state.dashboard.summary.students },
                { label: "Teachers", value: state.dashboard.summary.teachers },
                { label: "Classes", value: state.dashboard.summary.classes },
                { label: "Pending Requests", value: state.dashboard.summary.pending_requests },
                { label: "Attendance Records", value: state.dashboard.summary.attendance_records },
                { label: "Fee Ledger", value: formatCurrency(state.dashboard.summary.fees_total) },
              ]}
            />
          </Section>
          <Section title="Recent Password Requests">
            <PanelCard>
              <DataTable
                columns={[
                  { key: "username", label: "Username" },
                  { key: "role", label: "Role" },
                  { key: "request_type", label: "Type" },
                  { key: "message", label: "Message" },
                  { key: "status", label: "Status" },
                ]}
                rows={state.dashboard.recent_requests}
              />
            </PanelCard>
          </Section>
        </>
      ) : null}

      {active === "students" ? (
        <Section
          title="Student Management"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openCrudModal({
                  title: "Add Student",
                  fields: buildStudentFields(classOptions),
                  onSubmit: (payload) => saveCrudRecord("/api/admin-panel/students/", "create", payload),
                })
              }
            >
              Add Student
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "admission_number", label: "Admission #" },
                { key: "username", label: "Username" },
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "class_name", label: "Class" },
                { key: "guardian_name", label: "Guardian" },
              ]}
              rows={state.students}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() =>
                      openCrudModal({
                        title: `Edit ${row.username}`,
                        fields: buildStudentFields(classOptions),
                        initialData: row,
                        onSubmit: (payload) => saveCrudRecord("/api/admin-panel/students/", "update", payload, row.id),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => deleteCrudRecord("/api/admin-panel/students/", row.id)}>
                    Delete
                  </button>
                  <button className="link-button" type="button" onClick={() => resetPassword(row.user_id)}>
                    Reset Password
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "teachers" ? (
        <Section
          title="Teacher Management"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openCrudModal({
                  title: "Add Teacher",
                  fields: buildTeacherFields(),
                  onSubmit: (payload) => saveCrudRecord("/api/admin-panel/teachers/", "create", payload),
                })
              }
            >
              Add Teacher
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "employee_id", label: "Employee ID" },
                { key: "username", label: "Username" },
                { key: "first_name", label: "First Name" },
                { key: "last_name", label: "Last Name" },
                { key: "department", label: "Department" },
                { key: "phone", label: "Phone" },
              ]}
              rows={state.teachers}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() =>
                      openCrudModal({
                        title: `Edit ${row.username}`,
                        fields: buildTeacherFields(),
                        initialData: row,
                        onSubmit: (payload) => saveCrudRecord("/api/admin-panel/teachers/", "update", payload, row.id),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => deleteCrudRecord("/api/admin-panel/teachers/", row.id)}>
                    Delete
                  </button>
                  <button className="link-button" type="button" onClick={() => resetPassword(row.user_id)}>
                    Reset Password
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "classes" ? (
        <Section
          title="Class Management"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openCrudModal({
                  title: "Add Class",
                  fields: buildClassFields(teacherOptions),
                  onSubmit: (payload) => saveCrudRecord("/api/admin-panel/classes/", "create", payload),
                })
              }
            >
              Add Class
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "name", label: "Class" },
                { key: "section", label: "Section" },
                { key: "teacher_name", label: "Teacher" },
                { key: "room", label: "Room" },
                { key: "schedule", label: "Schedule" },
              ]}
              rows={state.classes}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() =>
                      openCrudModal({
                        title: `Edit ${row.name} - ${row.section}`,
                        fields: buildClassFields(teacherOptions),
                        initialData: row,
                        onSubmit: (payload) => saveCrudRecord("/api/admin-panel/classes/", "update", payload, row.id),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => deleteCrudRecord("/api/admin-panel/classes/", row.id)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "fees" ? (
        <Section
          title="Fee Ledger"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() =>
                openCrudModal({
                  title: "Add Fee",
                  fields: buildFeeFields(studentOptions),
                  onSubmit: (payload) => saveCrudRecord("/api/admin-panel/fees/", "create", payload),
                })
              }
            >
              Add Fee
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "student_name", label: "Student" },
                { key: "title", label: "Title" },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "amount_paid", label: "Paid", render: (row) => formatCurrency(row.amount_paid) },
                { key: "status", label: "Status" },
                { key: "due_date", label: "Due Date" },
              ]}
              rows={state.fees}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() =>
                      openCrudModal({
                        title: `Edit ${row.title}`,
                        fields: buildFeeFields(studentOptions),
                        initialData: row,
                        onSubmit: (payload) => saveCrudRecord("/api/admin-panel/fees/", "update", payload, row.id),
                      })
                    }
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => deleteCrudRecord("/api/admin-panel/fees/", row.id)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "passwords" ? (
        <Section title="Password Visibility" subtitle="Admin-only access to teacher and student credentials by role.">
          <PanelCard>
            <div className="toolbar-row">
              <h3>Password Catalog</h3>
              <select value={passwordRole} onChange={(event) => setPasswordRole(event.target.value)}>
                <option value="teachers">Teachers</option>
                <option value="students">Students</option>
              </select>
            </div>
            <DataTable
              columns={[
                { key: "full_name", label: "Name" },
                { key: "username", label: "Username" },
                { key: "label", label: passwordRole === "teachers" ? "Employee ID" : "Admission #" },
                { key: "plain_password", label: "Password" },
              ]}
              rows={state.passwords[passwordRole]}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "requests" ? (
        <Section title="Password Requests" subtitle="Forgot password and manual change requests from students and teachers.">
          <PanelCard>
            <DataTable
              columns={[
                { key: "username", label: "Username" },
                { key: "role", label: "Role" },
                { key: "request_type", label: "Type" },
                { key: "message", label: "Message" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Created" },
              ]}
              rows={state.requests}
              actions={(row) => (
                <div className="table-actions">
                  <button className="link-button" type="button" onClick={() => resetPassword(row.user_id)}>
                    Reset Password
                  </button>
                  {row.status === "pending" ? (
                    <button className="link-button" type="button" onClick={() => resolveRequest(row.id)}>
                      Resolve
                    </button>
                  ) : null}
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {modal ? <FormModal title={modal.title} fields={modal.fields} initialData={modal.initialData} onClose={closeModal} onSubmit={modal.onSubmit} /> : null}
    </DashboardShell>
  );
}

function TeacherDashboard({ user, refreshToken, onLogout, notify, theme, onToggleTheme }) {
  const [active, setActive] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [grades, setGrades] = useState([]);
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null);
  const [passwordState, setPasswordState] = useState({ current_password: "", new_password: "", request_message: "" });

  const loadData = async () => {
    const [dashboardData, attendanceData, gradesData, requestData] = await Promise.all([
      api.get("/api/teacher/dashboard/"),
      api.get("/api/teacher/attendance/"),
      api.get("/api/teacher/grades/"),
      api.get("/api/auth/password-requests/"),
    ]);
    setDashboard(dashboardData);
    setAttendance(attendanceData);
    setGrades(gradesData);
    setRequests(requestData.requests);
  };

  useEffect(() => {
    loadData().catch((error) => notify(error.message, "error"));
  }, [refreshToken]);

  const classOptions = useMemo(
    () => (dashboard?.classes || []).map((schoolClass) => ({ value: schoolClass.id, label: `${schoolClass.name} - ${schoolClass.section}` })),
    [dashboard],
  );
  const studentOptions = useMemo(
    () =>
      (dashboard?.classes || []).flatMap((schoolClass) =>
        schoolClass.students.map((student) => ({
          value: student.id,
          label: `${student.name} (${student.admission_number})`,
          classId: schoolClass.id,
        })),
      ),
    [dashboard],
  );

  const saveAttendance = async (payload, id) => {
    if (id) {
      await api.put(`/api/teacher/attendance/${id}/`, payload);
    } else {
      await api.post("/api/teacher/attendance/", payload);
    }
    await loadData();
    setModal(null);
    notify("Attendance saved.", "success");
  };

  const saveGrade = async (payload, id) => {
    if (id) {
      await api.put(`/api/teacher/grades/${id}/`, payload);
    } else {
      await api.post("/api/teacher/grades/", payload);
    }
    await loadData();
    setModal(null);
    notify("Grade saved.", "success");
  };

  const removeRecord = async (url) => {
    if (!window.confirm("Delete this record?")) {
      return;
    }
    try {
      await api.delete(url);
      await loadData();
      notify("Record deleted.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const changePassword = async () => {
    try {
      await api.post("/api/auth/change-password/", {
        current_password: passwordState.current_password,
        new_password: passwordState.new_password,
      });
      setPasswordState({ current_password: "", new_password: "", request_message: "" });
      await loadData();
      notify("Password changed.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const requestPasswordChange = async () => {
    try {
      await api.post("/api/auth/password-requests/", { message: passwordState.request_message || "Teacher requested a password reset." });
      setPasswordState((current) => ({ ...current, request_message: "" }));
      await loadData();
      notify("Password request sent to admin.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "grades", label: "Grades" },
    { key: "security", label: "Security" },
  ];

  return (
    <DashboardShell
      user={user}
      items={navItems}
      active={active}
      onChange={setActive}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      {active === "overview" && dashboard ? (
        <>
          <Section title="Teacher Dashboard" subtitle="Manage your assigned classes, attendance, and grades only.">
            <SummaryCards
              items={[
                { label: "Assigned Classes", value: dashboard.summary.classes },
                { label: "Students", value: dashboard.summary.students },
                { label: "Attendance Records", value: dashboard.summary.attendance_records },
                { label: "Grade Records", value: dashboard.summary.grade_records },
              ]}
            />
          </Section>
          <Section title="Assigned Classes">
            <div className="class-grid">
              {dashboard.classes.map((schoolClass) => (
                <PanelCard key={schoolClass.id}>
                  <h3>{schoolClass.name} - {schoolClass.section}</h3>
                  <p>{schoolClass.schedule || "Schedule not set"}</p>
                  <span>{schoolClass.students.length} students</span>
                </PanelCard>
              ))}
            </div>
          </Section>
        </>
      ) : null}

      {active === "attendance" ? (
        <Section
          title="Attendance Records"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() => setModal({ title: "Add Attendance", fields: buildAttendanceFields(classOptions, studentOptions), onSubmit: (payload) => saveAttendance(payload) })}
            >
              Add Attendance
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "student_name", label: "Student" },
                { key: "class_name", label: "Class" },
                { key: "date", label: "Date" },
                { key: "status", label: "Status" },
                { key: "remarks", label: "Remarks" },
              ]}
              rows={attendance}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => setModal({ title: "Edit Attendance", fields: buildAttendanceFields(classOptions, studentOptions), initialData: row, onSubmit: (payload) => saveAttendance(payload, row.id) })}
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => removeRecord(`/api/teacher/attendance/${row.id}/`)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "grades" ? (
        <Section
          title="Grade Book"
          action={
            <button
              className="primary-button"
              type="button"
              onClick={() => setModal({ title: "Add Grade", fields: buildGradeFields(classOptions, studentOptions), onSubmit: (payload) => saveGrade(payload) })}
            >
              Add Grade
            </button>
          }
        >
          <PanelCard>
            <DataTable
              columns={[
                { key: "student_name", label: "Student" },
                { key: "class_name", label: "Class" },
                { key: "subject", label: "Subject" },
                { key: "exam_name", label: "Exam" },
                { key: "score", label: "Score" },
                { key: "remarks", label: "Remarks" },
              ]}
              rows={grades}
              actions={(row) => (
                <div className="table-actions">
                  <button
                    className="link-button"
                    type="button"
                    onClick={() => setModal({ title: "Edit Grade", fields: buildGradeFields(classOptions, studentOptions), initialData: row, onSubmit: (payload) => saveGrade(payload, row.id) })}
                  >
                    Edit
                  </button>
                  <button className="link-button danger" type="button" onClick={() => removeRecord(`/api/teacher/grades/${row.id}/`)}>
                    Delete
                  </button>
                </div>
              )}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "security" ? (
        <Section title="Password Controls" subtitle="Direct password change plus request submission to the admin dashboard.">
          <div className="security-grid">
            <PanelCard>
              <h3>Change Password</h3>
              <div className="stack-form">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordState.current_password}
                  onChange={(event) => setPasswordState((current) => ({ ...current, current_password: event.target.value }))}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordState.new_password}
                  onChange={(event) => setPasswordState((current) => ({ ...current, new_password: event.target.value }))}
                />
                <button className="primary-button" type="button" onClick={changePassword}>
                  Update Password
                </button>
              </div>
            </PanelCard>
            <PanelCard>
              <h3>Request Admin Help</h3>
              <div className="stack-form">
                <textarea
                  rows="4"
                  placeholder="Describe the issue or request."
                  value={passwordState.request_message}
                  onChange={(event) => setPasswordState((current) => ({ ...current, request_message: event.target.value }))}
                />
                <button className="secondary-button" type="button" onClick={requestPasswordChange}>
                  Send Request
                </button>
              </div>
            </PanelCard>
          </div>
          <PanelCard>
            <h3>Your Request History</h3>
            <DataTable
              columns={[
                { key: "request_type", label: "Type" },
                { key: "message", label: "Message" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Created" },
              ]}
              rows={requests}
            />
          </PanelCard>
        </Section>
      ) : null}

      {modal ? <FormModal title={modal.title} fields={modal.fields} initialData={modal.initialData} onClose={() => setModal(null)} onSubmit={modal.onSubmit} /> : null}
    </DashboardShell>
  );
}

function StudentDashboard({ user, refreshToken, onLogout, notify, theme, onToggleTheme }) {
  const [active, setActive] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [passwordState, setPasswordState] = useState({ current_password: "", new_password: "", request_message: "" });

  const loadData = async () => {
    const [dashboardData, requestData] = await Promise.all([
      api.get("/api/student/dashboard/"),
      api.get("/api/auth/password-requests/"),
    ]);
    setDashboard(dashboardData);
    setRequests(requestData.requests);
  };

  useEffect(() => {
    loadData().catch((error) => notify(error.message, "error"));
  }, [refreshToken]);

  const changePassword = async () => {
    try {
      await api.post("/api/auth/change-password/", {
        current_password: passwordState.current_password,
        new_password: passwordState.new_password,
      });
      setPasswordState({ current_password: "", new_password: "", request_message: "" });
      await loadData();
      notify("Password changed.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const requestPasswordChange = async () => {
    try {
      await api.post("/api/auth/password-requests/", { message: passwordState.request_message || "Student requested a password reset." });
      setPasswordState((current) => ({ ...current, request_message: "" }));
      await loadData();
      notify("Password request sent to admin.", "success");
    } catch (error) {
      notify(error.message, "error");
    }
  };

  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "grades", label: "Grades" },
    { key: "fees", label: "Fees" },
    { key: "security", label: "Security" },
  ];

  return (
    <DashboardShell
      user={user}
      items={navItems}
      active={active}
      onChange={setActive}
      onLogout={onLogout}
      theme={theme}
      onToggleTheme={onToggleTheme}
    >
      {active === "overview" && dashboard ? (
        <>
          <Section title="Student Dashboard" subtitle="Read-only access to attendance, academic performance, and class details.">
            <SummaryCards
              items={[
                { label: "Attendance Rate", value: `${dashboard.summary.attendance_rate}%` },
                { label: "Subjects", value: dashboard.summary.subjects },
                { label: "Fees Due", value: formatCurrency(dashboard.summary.fees_due) },
                { label: "Class", value: dashboard.class_info ? `${dashboard.class_info.name} - ${dashboard.class_info.section}` : "Unassigned" },
              ]}
            />
          </Section>
          <div className="security-grid">
            <PanelCard>
              <h3>Class Information</h3>
              {dashboard.class_info ? (
                <div className="info-list">
                  <span>Teacher: {dashboard.class_info.teacher_name || "Not assigned"}</span>
                  <span>Room: {dashboard.class_info.room || "Not set"}</span>
                  <span>Schedule: {dashboard.class_info.schedule || "Not set"}</span>
                </div>
              ) : (
                <p>No class assigned.</p>
              )}
            </PanelCard>
            <PanelCard>
              <AttendanceDonut attendance={dashboard.attendance} />
            </PanelCard>
            <PanelCard>
              <h3>Profile Snapshot</h3>
              <div className="info-list">
                <span>Admission Number: {dashboard.profile.admission_number}</span>
                <span>Guardian: {dashboard.profile.guardian_name || "Not provided"}</span>
                <span>Phone: {dashboard.profile.phone || "Not provided"}</span>
              </div>
            </PanelCard>
          </div>
        </>
      ) : null}

      {active === "attendance" && dashboard ? (
        <Section title="Attendance">
          <PanelCard>
            <DataTable
              columns={[
                { key: "date", label: "Date" },
                { key: "class_name", label: "Class" },
                { key: "status", label: "Status" },
                { key: "remarks", label: "Remarks" },
              ]}
              rows={dashboard.attendance}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "grades" && dashboard ? (
        <Section title="Grades">
          <PanelCard>
            <DataTable
              columns={[
                { key: "subject", label: "Subject" },
                { key: "exam_name", label: "Exam" },
                { key: "score", label: "Score" },
                { key: "max_score", label: "Max Score" },
                { key: "remarks", label: "Remarks" },
              ]}
              rows={dashboard.grades}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "fees" && dashboard ? (
        <Section title="Fee Status">
          <PanelCard>
            <DataTable
              columns={[
                { key: "title", label: "Title" },
                { key: "amount", label: "Amount", render: (row) => formatCurrency(row.amount) },
                { key: "amount_paid", label: "Paid", render: (row) => formatCurrency(row.amount_paid) },
                { key: "status", label: "Status" },
                { key: "due_date", label: "Due Date" },
              ]}
              rows={dashboard.fees}
            />
          </PanelCard>
        </Section>
      ) : null}

      {active === "security" ? (
        <Section title="Password Controls">
          <div className="security-grid">
            <PanelCard>
              <h3>Change Password</h3>
              <div className="stack-form">
                <input
                  type="password"
                  placeholder="Current password"
                  value={passwordState.current_password}
                  onChange={(event) => setPasswordState((current) => ({ ...current, current_password: event.target.value }))}
                />
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordState.new_password}
                  onChange={(event) => setPasswordState((current) => ({ ...current, new_password: event.target.value }))}
                />
                <button className="primary-button" type="button" onClick={changePassword}>
                  Update Password
                </button>
              </div>
            </PanelCard>
            <PanelCard>
              <h3>Request Admin Help</h3>
              <div className="stack-form">
                <textarea
                  rows="4"
                  placeholder="Describe the issue or request."
                  value={passwordState.request_message}
                  onChange={(event) => setPasswordState((current) => ({ ...current, request_message: event.target.value }))}
                />
                <button className="secondary-button" type="button" onClick={requestPasswordChange}>
                  Send Request
                </button>
              </div>
            </PanelCard>
          </div>
          <PanelCard>
            <h3>Your Request History</h3>
            <DataTable
              columns={[
                { key: "request_type", label: "Type" },
                { key: "message", label: "Message" },
                { key: "status", label: "Status" },
                { key: "created_at", label: "Created" },
              ]}
              rows={requests}
            />
          </PanelCard>
        </Section>
      ) : null}
    </DashboardShell>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [banner, setBanner] = useState(null);
  const bannerTimeoutRef = useRef(null);
  const [theme, setTheme] = useState(() => window.localStorage.getItem("sms-theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("sms-theme", theme);
  }, [theme]);

  const notify = (message, type = "success") => {
    setBanner({ message, type });
    window.clearTimeout(bannerTimeoutRef.current);
    bannerTimeoutRef.current = window.setTimeout(() => setBanner(null), 3000);
  };

  const loadUser = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/auth/me/");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogin = async (payload) => {
    const data = await api.post("/api/auth/login/", payload);
    setUser(data.user);
    setRefreshToken((value) => value + 1);
    notify("Login successful.", "success");
  };

  const handleLogout = async () => {
    await api.post("/api/auth/logout/", {});
    setUser(null);
    notify("Logged out.", "success");
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  };

  if (loading) {
    return <div className="loading-screen">Loading Student Management System...</div>;
  }

  return (
    <>
      {banner ? <div className={`banner ${banner.type}`}>{banner.message}</div> : null}
      {!user ? <LoginScreen onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} /> : null}
      {user?.role === "admin" ? (
        <AdminDashboard user={user} refreshToken={refreshToken} onLogout={handleLogout} notify={notify} theme={theme} onToggleTheme={toggleTheme} />
      ) : null}
      {user?.role === "teacher" ? (
        <TeacherDashboard user={user} refreshToken={refreshToken} onLogout={handleLogout} notify={notify} theme={theme} onToggleTheme={toggleTheme} />
      ) : null}
      {user?.role === "student" ? (
        <StudentDashboard user={user} refreshToken={refreshToken} onLogout={handleLogout} notify={notify} theme={theme} onToggleTheme={toggleTheme} />
      ) : null}
    </>
  );
}
