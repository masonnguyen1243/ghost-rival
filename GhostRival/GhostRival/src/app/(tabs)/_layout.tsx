import { Tabs } from 'expo-router'
import { Text, ColorValue } from 'react-native'
import {
  SURFACE_RAISED,
  BORDER_SUBTLE,
  INK_PRIMARY,
  INK_DISABLED,
} from '../../constants'

function HomeIcon({ color }: { color: ColorValue }) {
  return <Text style={{ color, fontSize: 22 }}>👻</Text>
}

function TrophyIcon({ color }: { color: ColorValue }) {
  return <Text style={{ color, fontSize: 22 }}>🏆</Text>
}

function SettingsIcon({ color }: { color: ColorValue }) {
  return <Text style={{ color, fontSize: 22 }}>⚙️</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: SURFACE_RAISED,
          borderTopColor: BORDER_SUBTLE,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: INK_PRIMARY,
        tabBarInactiveTintColor: INK_DISABLED,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          tabBarLabel: ({ focused }) =>
            focused ? <Text style={{ color: INK_PRIMARY, fontSize: 11, fontFamily: 'DMSans_400Regular' }}>Home</Text> : null,
        }}
      />
      <Tabs.Screen
        name="hall-of-fame"
        options={{
          title: 'Hall of Fame',
          tabBarIcon: ({ color }) => <TrophyIcon color={color} />,
          tabBarLabel: ({ focused }) =>
            focused ? <Text style={{ color: INK_PRIMARY, fontSize: 11, fontFamily: 'DMSans_400Regular' }}>Hall of Fame</Text> : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarLabel: ({ focused }) =>
            focused ? <Text style={{ color: INK_PRIMARY, fontSize: 11, fontFamily: 'DMSans_400Regular' }}>Settings</Text> : null,
        }}
      />
    </Tabs>
  )
}
