import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

export type User = {
  id: string;
  email: string;
  username: string;
  phoneNumber?: string;
  gender?: string;
  profilePicture?: string;
  isVerified: boolean;
  isApproved: boolean;
  role: "USER" | "ADMIN";
  createdAt: Date;
  updatedAt: Date;
  subscription?: {
    id: string;
    plan: "FREE" | "BASIC" | "PREMIUM" | "ENTERPRISE";
    status: "PENDING" | "ACTIVE" | "CANCELED" | "EXPIRED";
    startDate: string | null;
    endDate: string | null;
    paymentMethod: "CASH" | "STRIPE" | "PAYPAL";
  };
};

interface SignupData {
  email: string;
  password: string;
  username: string;
  phoneNumber?: string;
  gender?: string;
}

interface UpdateProfileData {
  username?: string;
  phoneNumber?: string;
  gender?: string;
  profilePicture?: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  verifyLogin: (
    email: string,
    token: string
  ) => Promise<{
    success: boolean;
    message: string;
    user?: User;
    token?: string;
  }>;
  signup: (
    userData: SignupData
  ) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; message: string }>;
  resendVerificationEmail: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  resetPassword: (
    token: string,
    newPassword: string
  ) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateProfile: (
    data: UpdateProfileData
  ) => Promise<{ success: boolean; message: string }>;
  uploadProfilePicture: (
    file: File
  ) => Promise<{ success: boolean; message: string; profilePicture?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.user) {
        // Fetch subscription data if user exists
        try {
          const subscriptionResponse = await axios.get(
            "/api/subscriptions/current",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (subscriptionResponse.data.success) {
            // Add subscription data to user object
            setUser({
              ...response.data.user,
              subscription: subscriptionResponse.data.subscription,
            });
          } else {
            setUser(response.data.user);
          }
        } catch (error) {
          // If subscription fetch fails, still set the user
          setUser(response.data.user);
          console.error("Subscription fetch error:", error);
        }
      }
    } catch (error: unknown) {
      localStorage.removeItem("authToken");
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      return response.data;
    } catch (error: unknown) {
      console.error("Login error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Login failed",
        };
      }
      return { success: false, message: "Unexpected login error" };
    }
  };

  const verifyLogin = async (email: string, token: string) => {
    try {
      const response = await axios.post("/api/auth/verify-login", {
        email,
        token,
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem("authToken", response.data.token);
        setUser(response.data.user);
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Login verification error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Verification failed",
        };
      }
      return { success: false, message: "Unexpected verification error" };
    }
  };

  const signup = async (userData: SignupData) => {
    try {
      const response = await axios.post("/api/auth/signup", userData);
      return response.data;
    } catch (error: unknown) {
      console.error("Signup error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Signup failed",
        };
      }
      return { success: false, message: "Unexpected signup error" };
    }
  };

  const verifyEmail = async (email: string, token: string) => {
    try {
      const response = await axios.post("/api/auth/verify-email", {
        email,
        token,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Email verification error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Email verification failed",
        };
      }
      return { success: false, message: "Unexpected verification error" };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await axios.post("/api/auth/resend-verification", {
        email,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Resend verification error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message:
            error.response?.data?.message ||
            "Failed to resend verification email",
        };
      }
      return { success: false, message: "Unexpected error" };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await axios.post("/api/auth/forgot-password", { email });
      return response.data;
    } catch (error: unknown) {
      console.error("Forgot password error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Request failed",
        };
      }
      return { success: false, message: "Unexpected error" };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const response = await axios.post("/api/auth/reset-password", {
        token,
        password: newPassword,
        confirmPassword: newPassword,
      });
      return response.data;
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Password reset failed",
        };
      }
      return { success: false, message: "Unexpected error" };
    }
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      localStorage.removeItem("authToken");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return { success: false, message: "Not authenticated" };
      }

      const response = await axios.put("/api/users/update-profile", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUser((prevUser) => {
          if (!prevUser) return null;
          return { ...prevUser, ...data };
        });
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Update failed",
        };
      }
      return { success: false, message: "Unexpected error" };
    }
  };

  const uploadProfilePicture = async (file: File) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        return { success: false, message: "Not authenticated" };
      }

      const formData = new FormData();
      formData.append("profilePicture", file);

      const response = await axios.post(
        "/api/users/upload-profile-picture",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setUser((prevUser) => {
          if (!prevUser) return null;
          return { ...prevUser, profilePicture: response.data.profilePicture };
        });
      }

      return response.data;
    } catch (error: unknown) {
      console.error("Profile picture upload error:", error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: error.response?.data?.message || "Upload failed",
        };
      }
      return { success: false, message: "Unexpected error" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        verifyLogin,
        signup,
        verifyEmail,
        resendVerificationEmail,
        forgotPassword,
        resetPassword,
        logout,
        updateProfile,
        uploadProfilePicture,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
