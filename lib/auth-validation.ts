import { z } from "zod"

// 登录表单验证schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱地址过长"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(6, "密码至少需要6个字符")
    .max(128, "密码过长"),
})

// 注册表单验证schema（扩展用）
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱地址过长"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(8, "密码至少需要8个字符")
    .max(128, "密码过长")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "密码必须包含至少一个小写字母、一个大写字母和一个数字"
    ),
  confirmPassword: z.string().min(1, "请确认密码"),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

// 密码重置验证schema（扩展用）
export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱地址过长"),
})

// 修改密码验证schema（扩展用）
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z
    .string()
    .min(1, "请输入新密码")
    .min(8, "新密码至少需要8个字符")
    .max(128, "新密码过长")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "密码必须包含至少一个小写字母、一个大写字母和一个数字"
    ),
  confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

// 导出类型推断
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>