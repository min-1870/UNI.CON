import { useThemeColor } from '@/hooks/useThemeColor';
import { Pressable, Text, type ButtonProps } from 'react-native';
import { ReactNode } from 'react';

type SolidButtontProps = Omit<ButtonProps, 'title'> & {
  lightColor?: string;
  darkColor?: string;
  children: ReactNode;
};

function SolidButton({
  lightColor,
  darkColor,
  children,
  ...rest
}: SolidButtontProps) {
    const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'solidButtonBackground');
    const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'solidButtonText');

  return (
    <Pressable
      style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
          padding: 12,
          backgroundColor,
          borderRadius: 7,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
      })}
      {...rest}
    >
        <Text style={{ color: textColor }}>{children}</Text>
    </Pressable>
  );
}

export { SolidButton };