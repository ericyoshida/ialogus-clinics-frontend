import { cn } from '@/lib/utils'
import { Channel } from '@/mock/conversations'
import { ChatIcon } from './ChatIcon'
import { EmailIcon } from './EmailIcon'
import { InstagramIcon } from './InstagramIcon'
import { SmsIcon } from './SmsIconNew'
import { WhatsAppIcon } from './WhatsAppIcon'

type ChannelIconProps = {
  channel: Channel;
  className?: string;
  size?: number;
};

export function ChannelIcon({ channel, className, size = 16 }: ChannelIconProps) {
  const iconProps = {
    className: cn(className),
    width: size,
    height: size,
  };

  switch (channel) {
    case 'whatsapp':
      return <WhatsAppIcon {...iconProps} />;
    case 'instagram':
      return <InstagramIcon {...iconProps} />;
    case 'email':
      return <EmailIcon {...iconProps} />;
    case 'sms':
      return <SmsIcon {...iconProps} />;
    default:
      return <ChatIcon {...iconProps} />;
  }
} 