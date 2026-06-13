import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  ResendOtpDto,
  ResetPasswordDto,
  SignupDto,
  VerifyOtpDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyEmail(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('resend-otp')
  resend(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto.email);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser('userId') userId: string) {
    return this.auth.me(userId);
  }
}
