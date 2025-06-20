import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLogo } from '@/components/icons/AppLogo';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, validateInput } from '@/lib/validations';
import { toast } from '@/components/ui/use-toast';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ usernameOrEmail?: string; password?: string }>({});
  const { login, isLoading } = useAuth();

  const validateForm = () => {
    const result = validateInput(loginSchema, { usernameOrEmail, password });
    
    if (!result.success) {
      setErrors({ usernameOrEmail: result.error.includes('User ID') ? result.error : undefined, 
                 password: result.error.includes('Password') ? result.error : undefined });
      toast({
        title: 'Validasi Gagal',
        description: result.error,
        variant: 'destructive',
      });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      await login(usernameOrEmail, password);
      // Redirect dan error handling dilakukan di dalam hook useAuth
    } catch (error) {
      // Error handling tambahan jika diperlukan
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <AppLogo className="h-28 w-28 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">INSAN MOBILE</CardTitle>
          <CardDescription>Silakan login untuk melanjutkan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail">User ID / Email</Label>
              <Input
                id="usernameOrEmail"
                type="text"
                placeholder="Masukkan User ID atau Email Anda"
                value={usernameOrEmail}
                onChange={e => {
                  setUsernameOrEmail(e.target.value);
                  if (errors.usernameOrEmail) setErrors({...errors, usernameOrEmail: undefined});
                }}
                className={`bg-input border-border focus:ring-primary focus:border-primary ${errors.usernameOrEmail ? 'border-red-500' : ''}`}
              />
              {errors.usernameOrEmail && (
                <p className="text-sm text-red-500">{errors.usernameOrEmail}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({...errors, password: undefined});
                  }}
                  className={`bg-input border-border focus:ring-primary focus:border-primary pr-10 ${errors.password ? 'border-red-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
            <Button 
              className="bg-blue-500 text-white p-2 w-full rounded" 
              onClick={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? 'Memproses...' : (
                <>
                  <LogIn className="mr-2 h-5 w-5" /> Login
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PIS. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}