import Link from 'next/link';

interface LogoProps {
  className?: string;
  linkClassName?: string;
}

export default function Logo({ className = '', linkClassName = '' }: LogoProps) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${linkClassName}`}>
      <img
        src="/bond-logo.png"
        alt="Bond logo"
        width={32}
        height={32}
        className="rounded-md object-contain"
      />
      <span className={`font-bold text-xl ${className}`}>Bond</span>
    </Link>
  );
}
