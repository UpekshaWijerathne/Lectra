
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// Mock authentication functions
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  loginWithGoogle: vi.fn(),
  resetPassword: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("../AuthContext", () => ({
  useAuth: () => ({
    login: mocks.login,
    loginWithGoogle: mocks.loginWithGoogle,
    resetPassword: mocks.resetPassword,
  }),
}));

// Mock navigation while keeping other router functions
vi.mock("react-router-dom", async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    useNavigate: () => mocks.navigate,
  };
});

// Mock role-based home path
vi.mock("../lib/roles", () => ({
  homePathForRole: (role) => `/${role}`,
}));

// Mock Firebase error formatter
vi.mock("../lib/errors", () => ({
  friendlyAuthError: (error) => error.message,
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

function getEmail() {
  return screen.getByPlaceholderText("student@university.edu");
}

function getPassword() {
  return document.querySelector('input[type="password"]');
}

function getLoginButton() {
  return screen.getByRole("button", {
    name: /log in to lectra/i,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Lectra Login Page Tests", () => {

  it("TC-L01: renders login heading", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        name: "Log in to Lectra",
      })
    ).toBeInTheDocument();
  });

  it("TC-L02: displays email and password fields", () => {
    renderLogin();

    expect(getEmail()).toBeInTheDocument();
    expect(getPassword()).toBeInTheDocument();
  });

  it("TC-L03: prevents submission with empty fields", async () => {
    renderLogin();

    fireEvent.click(getLoginButton());

    expect(mocks.login).not.toHaveBeenCalled();
    expect(getEmail()).toBeInvalid();
  });

  it("TC-L04: allows entering email and password", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(getEmail(), "student@university.edu");
    await user.type(getPassword(), "Password123");

    expect(getEmail()).toHaveValue("student@university.edu");
    expect(getPassword()).toHaveValue("Password123");
  });

  it("TC-L05: calls login with valid form values", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ role: "student" });

    renderLogin();

    await user.type(getEmail(), "student@university.edu");
    await user.type(getPassword(), "Password123");

    await user.click(getLoginButton());

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        "student@university.edu",
        "Password123"
      );
    });
  });

  it("TC-L06: displays invalid credentials error", async () => {
    const user = userEvent.setup();

    mocks.login.mockRejectedValue(
      new Error("Invalid email or password")
    );

    renderLogin();

    await user.type(getEmail(), "student@university.edu");
    await user.type(getPassword(), "WrongPassword");

    await user.click(getLoginButton());

    expect(
      await screen.findByText("Invalid email or password")
    ).toBeInTheDocument();
  });

  it("TC-L07: redirects student after successful login", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ role: "student" });

    renderLogin();

    await user.type(getEmail(), "student@university.edu");
    await user.type(getPassword(), "Password123");

    await user.click(getLoginButton());

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith(
        "/student",
        { replace: true }
      );
    });
  });

  it("TC-L08: redirects user without a role", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValue({ role: null });

    renderLogin();

    await user.type(getEmail(), "student@university.edu");
    await user.type(getPassword(), "Password123");

    await user.click(getLoginButton());

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith(
        "/choose-role",
        { replace: true }
      );
    });
  });

  it("TC-L09: calls Google login", async () => {
    const user = userEvent.setup();
    mocks.loginWithGoogle.mockResolvedValue({ role: "student" });

    renderLogin();

    await user.click(
      screen.getByRole("button", {
        name: /continue with google workspace/i,
      })
    );

    await waitFor(() => {
      expect(mocks.loginWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-L10: shows error when resetting password without email", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(
      screen.getByText("Forgot password?")
    );

    expect(
      screen.getByText(/enter your email address first/i)
    ).toBeInTheDocument();

    expect(mocks.resetPassword).not.toHaveBeenCalled();
  });

  it("TC-L11: sends password reset request", async () => {
    const user = userEvent.setup();
    mocks.resetPassword.mockResolvedValue(undefined);

    renderLogin();

    await user.type(getEmail(), "student@university.edu");

    await user.click(
      screen.getByText("Forgot password?")
    );

    await waitFor(() => {
      expect(mocks.resetPassword).toHaveBeenCalledWith(
        "student@university.edu"
      );
    });

    expect(
      screen.getByRole("status")
    ).toHaveTextContent("password reset link");
  });

  it("TC-L12: converts session code to uppercase", async () => {
    const user = userEvent.setup();
    renderLogin();

    const codeInput = screen.getByPlaceholderText(
      "e.g. 482910 or CS101A"
    );

    await user.type(codeInput, "cs101a");

    expect(codeInput).toHaveValue("CS101A");
  });

  it("TC-L13: removes special characters from session code", () => {
    renderLogin();

    const codeInput = screen.getByPlaceholderText(
      "e.g. 482910 or CS101A"
    );

    fireEvent.change(codeInput, {
      target: { value: "ab@#12" },
    });

    expect(codeInput).toHaveValue("AB12");
  });

  it("TC-L14: redirects using valid session code", async () => {
    const user = userEvent.setup();
    renderLogin();

    const codeInput = screen.getByPlaceholderText(
      "e.g. 482910 or CS101A"
    );

    await user.type(codeInput, "CS101A");

    await user.click(
      screen.getByRole("button", {
        name: /join room/i,
      })
    );

    expect(mocks.navigate).toHaveBeenCalledWith(
      "/student?code=CS101A"
    );
  });

  it("TC-L15: rejects incomplete session code", async () => {
    const user = userEvent.setup();
    renderLogin();

    const codeInput = screen.getByPlaceholderText(
      "e.g. 482910 or CS101A"
    );

    await user.type(codeInput, "ABC");

    await user.click(
      screen.getByRole("button", {
        name: /join room/i,
      })
    );

    expect(
      screen.getByText("Please enter the 6-character session code.")
    ).toBeInTheDocument();

    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("TC-L16: displays registration link", () => {
    renderLogin();

    const registerLink = screen.getByRole("link", {
      name: "Create an account",
    });

    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("TC-L17: remember device checkbox can be selected", async () => {
    const user = userEvent.setup();
    renderLogin();

    const checkbox = screen.getByRole("checkbox", {
      name: /remember this device/i,
    });

    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
  });

});
