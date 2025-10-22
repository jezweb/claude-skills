/**
 * shadcn/ui Form Component Integration
 *
 * Demonstrates:
 * - shadcn/ui Form component with React Hook Form + Zod
 * - FormField, FormItem, FormLabel, FormControl, FormMessage components
 * - Type-safe form with proper error handling
 * - Accessible form structure
 *
 * Installation:
 * npx shadcn@latest add form input button
 */

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

// Define schema
const profileFormSchema = z.object({
  username: z.string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must not be longer than 30 characters.' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address.' }),
  bio: z.string()
    .max(160, { message: 'Bio must not be longer than 160 characters.' })
    .optional(),
  role: z.enum(['admin', 'user', 'guest'], {
    required_error: 'Please select a role.',
  }),
  notifications: z.boolean().default(false).optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ShadcnProfileForm() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
      notifications: false,
    },
  })

  function onSubmit(data: ProfileFormValues) {
    console.log('Form submitted:', data)
    // Make API call
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold">Profile Settings</h2>

        {/* Username Field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email with anyone.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio Field (Textarea) */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can write up to 160 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role Field (Select) */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your account type.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notifications Field (Checkbox) */}
        <FormField
          control={form.control}
          name="notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Email notifications
                </FormLabel>
                <FormDescription>
                  Receive email notifications about your account activity.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving...' : 'Update profile'}
        </Button>
      </form>
    </Form>
  )
}

/**
 * Multiple Field Types Example
 */
const settingsFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  language: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  emailPreferences: z.object({
    marketing: z.boolean().default(false),
    updates: z.boolean().default(true),
    security: z.boolean().default(true),
  }),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export function ShadcnSettingsForm() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: '',
      language: 'en',
      theme: 'system',
      emailPreferences: {
        marketing: false,
        updates: true,
        security: true,
      },
    },
  })

  function onSubmit(data: SettingsFormValues) {
    console.log('Settings updated:', data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold">Settings</h2>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Theme */}
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Theme</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Preferences (Nested Object with Checkboxes) */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Preferences</h3>

          <FormField
            control={form.control}
            name="emailPreferences.marketing"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Marketing emails</FormLabel>
                  <FormDescription>
                    Receive emails about new products and features.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailPreferences.updates"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Update emails</FormLabel>
                  <FormDescription>
                    Receive emails about your account updates.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailPreferences.security"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Security emails</FormLabel>
                  <FormDescription>
                    Receive emails about your account security (recommended).
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Save settings</Button>
      </form>
    </Form>
  )
}

/**
 * NOTE: shadcn/ui states "We are not actively developing the Form component anymore."
 * They recommend using the Field component for new implementations.
 * Check https://ui.shadcn.com/docs/components/form for latest guidance.
 */
