import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import NotificationToggle, { NotificationGroup } from './NotificationToggle';

const meta: Meta<typeof NotificationToggle> = {
  title: 'Settings/NotificationToggle',
  component: NotificationToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['bell', 'mail', 'message', 'megaphone', 'phone', 'briefcase', 'send'],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-white dark:bg-neutral-900 rounded-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationToggle>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <NotificationToggle
        label="New Messages"
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const WithIcon: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <NotificationToggle
        label="Email Notifications"
        icon="mail"
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const WithDescription: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <NotificationToggle
        label="Marketing Emails"
        description="Receive promotional offers and updates"
        icon="megaphone"
        checked={checked}
        onChange={setChecked}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <NotificationToggle
      label="Premium Feature"
      description="Upgrade to enable this feature"
      icon="bell"
      checked={false}
      onChange={() => {}}
      disabled
    />
  ),
};

export const AllIcons: Story = {
  render: () => {
    const [states, setStates] = useState({
      bell: true,
      mail: false,
      message: true,
      megaphone: false,
      phone: true,
      briefcase: false,
      send: true,
    });

    const icons = ['bell', 'mail', 'message', 'megaphone', 'phone', 'briefcase', 'send'] as const;

    return (
      <div className="space-y-1">
        {icons.map((icon) => (
          <NotificationToggle
            key={icon}
            label={icon.charAt(0).toUpperCase() + icon.slice(1)}
            icon={icon}
            checked={states[icon]}
            onChange={(checked) => setStates({ ...states, [icon]: checked })}
          />
        ))}
      </div>
    );
  },
};

// NotificationGroup stories
export const GroupExample: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true);
    const [items, setItems] = useState({
      newJobs: true,
      proposals: true,
      messages: false,
    });

    return (
      <NotificationGroup
        title="Email Notifications"
        description="Receive updates via email"
        icon="mail"
        enabled={enabled}
        onEnabledChange={setEnabled}
      >
        <NotificationToggle
          label="New Jobs"
          icon="briefcase"
          checked={items.newJobs}
          onChange={(checked) => setItems({ ...items, newJobs: checked })}
        />
        <NotificationToggle
          label="Proposals"
          icon="send"
          checked={items.proposals}
          onChange={(checked) => setItems({ ...items, proposals: checked })}
        />
        <NotificationToggle
          label="Messages"
          icon="message"
          checked={items.messages}
          onChange={(checked) => setItems({ ...items, messages: checked })}
        />
      </NotificationGroup>
    );
  },
};

export const SettingsPageExample: Story = {
  render: () => {
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

    const [emailItems, setEmailItems] = useState({
      newJobs: true,
      proposals: true,
      messages: true,
      marketing: false,
    });

    const [pushItems, setPushItems] = useState({
      newJobs: true,
      proposals: false,
      messages: true,
    });

    return (
      <div className="w-full max-w-md space-y-4">
        <NotificationGroup
          title="Email Notifications"
          description="Receive updates via email"
          icon="mail"
          enabled={emailEnabled}
          onEnabledChange={setEmailEnabled}
        >
          <NotificationToggle
            label="New Jobs"
            checked={emailItems.newJobs}
            onChange={(checked) => setEmailItems({ ...emailItems, newJobs: checked })}
          />
          <NotificationToggle
            label="Proposals"
            checked={emailItems.proposals}
            onChange={(checked) => setEmailItems({ ...emailItems, proposals: checked })}
          />
          <NotificationToggle
            label="Messages"
            checked={emailItems.messages}
            onChange={(checked) => setEmailItems({ ...emailItems, messages: checked })}
          />
          <NotificationToggle
            label="Marketing"
            checked={emailItems.marketing}
            onChange={(checked) => setEmailItems({ ...emailItems, marketing: checked })}
          />
        </NotificationGroup>

        <NotificationGroup
          title="Push Notifications"
          description="Receive push notifications"
          icon="bell"
          enabled={pushEnabled}
          onEnabledChange={setPushEnabled}
        >
          <NotificationToggle
            label="New Jobs"
            checked={pushItems.newJobs}
            onChange={(checked) => setPushItems({ ...pushItems, newJobs: checked })}
          />
          <NotificationToggle
            label="Proposals"
            checked={pushItems.proposals}
            onChange={(checked) => setPushItems({ ...pushItems, proposals: checked })}
          />
          <NotificationToggle
            label="Messages"
            checked={pushItems.messages}
            onChange={(checked) => setPushItems({ ...pushItems, messages: checked })}
          />
        </NotificationGroup>

        <NotificationGroup
          title="SMS Notifications"
          description="Receive SMS updates"
          icon="phone"
          enabled={smsEnabled}
          onEnabledChange={setSmsEnabled}
        >
          <NotificationToggle
            label="Important Updates"
            checked={false}
            onChange={() => {}}
          />
        </NotificationGroup>
      </div>
    );
  },
};
