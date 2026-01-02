import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { User, Settings, Bell, CreditCard, Shield, Home } from 'lucide-react';
import { Tabs, TabPanel } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

const basicTabs = [
  { id: 'tab1', label: 'Profile' },
  { id: 'tab2', label: 'Settings' },
  { id: 'tab3', label: 'Notifications' },
];

export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs tabs={basicTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    );
  },
};

export const Pills: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs
          tabs={basicTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
      </div>
    );
  },
};

export const Underline: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs
          tabs={basicTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('profile');
    const tabs = [
      { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    ];
    return (
      <div className="w-[450px]">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    );
  },
};

export const WithBadges: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('inbox');
    const tabs = [
      { id: 'inbox', label: 'Inbox', badge: 12 },
      { id: 'sent', label: 'Sent' },
      { id: 'drafts', label: 'Drafts', badge: 3 },
      { id: 'spam', label: 'Spam', badge: '99+' },
    ];
    return (
      <div className="w-[500px]">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    );
  },
};

export const WithIconsAndBadges: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('profile');
    const tabs = [
      { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
      { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" />, badge: 2 },
      { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
      { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: 5 },
    ];
    return (
      <div className="w-[600px]">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    );
  },
};

export const WithDisabledTab: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    const tabs = [
      { id: 'tab1', label: 'Available' },
      { id: 'tab2', label: 'Coming Soon', disabled: true },
      { id: 'tab3', label: 'Settings' },
    ];
    return (
      <div className="w-96">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    );
  },
};

export const FullWidth: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs
          tabs={basicTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          fullWidth
        />
      </div>
    );
  },
};

export const SmallSize: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs
          tabs={basicTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="sm"
        />
      </div>
    );
  },
};

export const LargeSize: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96">
        <Tabs
          tabs={basicTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          size="lg"
        />
      </div>
    );
  },
};

export const WithPanels: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('home');
    const tabs = [
      { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
      { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];
    return (
      <div className="w-[500px]">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <div className="mt-4 p-4 border rounded-xl">
          <TabPanel tabId="home" activeTab={activeTab}>
            <h3 className="font-semibold mb-2">Welcome Home</h3>
            <p className="text-neutral-600 text-sm">
              This is the home tab content. You can put any content here.
            </p>
          </TabPanel>
          <TabPanel tabId="profile" activeTab={activeTab}>
            <h3 className="font-semibold mb-2">Your Profile</h3>
            <p className="text-neutral-600 text-sm">
              Manage your profile settings and preferences.
            </p>
          </TabPanel>
          <TabPanel tabId="settings" activeTab={activeTab}>
            <h3 className="font-semibold mb-2">Settings</h3>
            <p className="text-neutral-600 text-sm">
              Configure your application settings here.
            </p>
          </TabPanel>
        </div>
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    return (
      <div className="w-96 space-y-8">
        <div>
          <p className="text-xs text-neutral-500 mb-2">Default</p>
          <Tabs
            tabs={basicTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="default"
          />
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-2">Pills</p>
          <Tabs
            tabs={basicTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="pills"
          />
        </div>
        <div>
          <p className="text-xs text-neutral-500 mb-2">Underline</p>
          <Tabs
            tabs={basicTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
          />
        </div>
      </div>
    );
  },
};

export const Scrollable: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('tab1');
    const manyTabs = [
      { id: 'tab1', label: 'Overview' },
      { id: 'tab2', label: 'Analytics' },
      { id: 'tab3', label: 'Reports' },
      { id: 'tab4', label: 'Notifications' },
      { id: 'tab5', label: 'Settings' },
      { id: 'tab6', label: 'Billing' },
      { id: 'tab7', label: 'Security' },
      { id: 'tab8', label: 'Integrations' },
    ];
    return (
      <div className="w-80">
        <Tabs
          tabs={manyTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          scrollable
        />
      </div>
    );
  },
};
