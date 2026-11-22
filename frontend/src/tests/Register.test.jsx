
// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "../pages/Register";

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({
    register: mocks.register,
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("../lib/errors", () => ({
  friendlyAuthError: (error) => error.message,
}));

function renderRegister() {
  return render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );
}

function getFields() {
  return {
    name: screen.getByPlaceholderText(/e.g. sanduni perera/i),
    email: screen.getByPlaceholderText("name@university.ac.lk"),
    department: screen.getByPlaceholderText(
      /e.g. faculty of computing/i
    ),
    password: screen.getByPlaceholderText("Create password"),
    confirm: screen.getByPlaceholderText("Repeat password"),
  };
}

function fillForm({
  name = "Test Student",
  email = "student@university.ac.lk",
  department = "",
  password = "password123",
  confirm = password,
} = {}) {
  const fields = getFields();

  fireEvent.change(fields.name, {
    target: { value: name },
  });

  fireEvent.change(fields.email, {
    target: { value: email },
  });

  fireEvent.change(fields.department, {
    target: { value: department },
  });

  fireEvent.change(fields.password, {
    target: { value: password },
  });

  fireEvent.change(fields.confirm, {
    target: { value: confirm },
  });
}

function submitForm() {
  const button = screen.getByRole("button", {
    name: /create (student|lecturer) account/i,
  });

  fireEvent.click(button);
}

describe("Lectra Registration Page Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("TC-R01: renders registration heading", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", {
        name: /create your account/i,
      })
    ).toBeInTheDocument();
  });

  it("TC-R02: displays required form fields", () => {
    renderRegister();

    const fields = getFields();

    expect(fields.name).toBeInTheDocument();
    expect(fields.email).toBeInTheDocument();
    expect(fields.password).toBeInTheDocument();
    expect(fields.confirm).toBeInTheDocument();
  });

  it("TC-R03: selects student role by default", () => {
    renderRegister();

    expect(
      screen.getByRole("button", {
        name: /create student account/i,
      })
    ).toBeInTheDocument();
  });

  it("TC-R04: switches to lecturer role", () => {
    renderRegister();

    fireEvent.click(screen.getByText("Lecturer"));

    expect(
      screen.getByRole("button", {
        name: /create lecturer account/i,
      })
    ).toBeInTheDocument();
  });

  it("TC-R05: prevents registration with empty fields", () => {
    renderRegister();

    submitForm();

    expect(mocks.register).not.toHaveBeenCalled();
    expect(getFields().name.validity.valueMissing).toBe(true);
  });

  it("TC-R06: rejects passwords shorter than 6 characters", () => {
    renderRegister();

    fillForm({
      password: "123",
      confirm: "123",
    });

    submitForm();

    expect(
      screen.getByText(
        "Password must contain at least 6 characters."
      )
    ).toBeInTheDocument();

    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("TC-R07: rejects mismatched passwords", () => {
    renderRegister();

    fillForm({
      password: "password123",
      confirm: "different123",
    });

    submitForm();

    expect(
      screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();

    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("TC-R08: prevents registration when terms are not accepted", () => {
    renderRegister();

    fillForm();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    submitForm();

    expect(
      screen.getByText(/you must accept the academic terms/i)
    ).toBeInTheDocument();

    expect(mocks.register).not.toHaveBeenCalled();
  });

  it("TC-R09: registers a student successfully", async () => {
    mocks.register.mockResolvedValue({
      user: { role: "student" },
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith({
        name: "Test Student",
        email: "student@university.ac.lk",
        password: "password123",
        role: "student",
        department: undefined,
      });
    });
  });

  it("TC-R10: redirects student after registration", async () => {
    mocks.register.mockResolvedValue({
      user: { role: "student" },
    });

    renderRegister();
    fillForm();
    submitForm();

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith(
        "/student",
        { replace: true }
      );
    });
  });

  it("TC-R11: registers a lecturer successfully", async () => {
    mocks.register.mockResolvedValue({
      user: { role: "lecturer" },
    });

    renderRegister();

    fireEvent.click(screen.getByText("Lecturer"));

    const name = screen.getByPlaceholderText(
      "e.g. Dr. Catherine Silva"
    );

    fireEvent.change(name, {
      target: { value: "Dr. Silva" },
    });

    fireEvent.change(
      screen.getByPlaceholderText("name@university.ac.lk"),
      {
        target: { value: "lecturer@university.ac.lk" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText("Create password"),
      {
        target: { value: "password123" },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText("Repeat password"),
      {
        target: { value: "password123" },
      }
    );

    submitForm();

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Dr. Silva",
          role: "lecturer",
        })
      );

      expect(mocks.navigate).toHaveBeenCalledWith(
        "/lecturer",
        { replace: true }
      );
    });
  });

  it("TC-R12: includes optional department in registration", async () => {
    mocks.register.mockResolvedValue({
      user: { role: "student" },
    });

    renderRegister();

    fillForm({
      department: "Computer Engineering",
    });

    submitForm();

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith(
        expect.objectContaining({
          department: "Computer Engineering",
        })
      );
    });
  });

  it("TC-R13: trims name and normalizes email", async () => {
    mocks.register.mockResolvedValue({
      user: { role: "student" },
    });

    renderRegister();

    fillForm({
      name: "  Test Student  ",
      email: "STUDENT@UNIVERSITY.AC.LK",
    });

    submitForm();

    await waitFor(() => {
      expect(mocks.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Student",
          email: "student@university.ac.lk",
        })
      );
    });
  });

  it("TC-R14: displays registration errors", async () => {
    mocks.register.mockRejectedValue(
      new Error("Email already exists")
    );

    renderRegister();
    fillForm();
    submitForm();

    expect(
      await screen.findByText("Email already exists")
    ).toBeInTheDocument();
  });

  it("TC-R15: shows loading state during registration", async () => {
    mocks.register.mockReturnValue(
      new Promise(() => {})
    );

    renderRegister();
    fillForm();
    submitForm();

    expect(
      screen.getByRole("button", {
        name: /creating account/i,
      })
    ).toBeDisabled();
  });

  it("TC-R16: terms checkbox is selected by default", () => {
    renderRegister();

    expect(
      screen.getByRole("checkbox")
    ).toBeChecked();
  });

  it("TC-R17: displays login navigation link", () => {
    renderRegister();

    const link = screen.getByRole("link", {
      name: /already registered.*log in/i,
    });

    expect(link).toHaveAttribute("href", "/login");
  });

  it("TC-R18: shows password length requirement", () => {
    renderRegister();

    expect(
      screen.getByText("Minimum 6 characters")
    ).toBeInTheDocument();
  });
});
