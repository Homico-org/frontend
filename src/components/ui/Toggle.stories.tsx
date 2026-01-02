import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Toggle } from './Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'danger'],
    },
    labelPosition: {
      control: 'select',
      options: ['left', 'right'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Toggle checked={checked} onChange={(e) => setChecked(e.target.checked)} />
    );
  },
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Toggle checked={checked} onChange={(e) => setChecked(e.target.checked)} />
    );
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="w-64">
        <Toggle
          label="Enable notifications"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      </div>
    );
  },
};

export const WithLabelAndDescription: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="w-80">
        <Toggle
          label="Email notifications"
          description="Receive email updates about your account activity"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      </div>
    );
  },
};

export const LabelOnLeft: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="w-64">
        <Toggle
          label="Dark mode"
          labelPosition="left"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
      </div>
    );
  },
};

export const SmallSize: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Toggle
        size="sm"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const LargeSize: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Toggle
        size="lg"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const SuccessVariant: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Toggle
        variant="success"
        label="Active"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const DangerVariant: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <Toggle
        variant="danger"
        label="Delete on exit"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <Toggle label="Disabled (off)" disabled />
      <Toggle label="Disabled (on)" disabled checked />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => {
    const [values, setValues] = useState({ sm: false, md: true, lg: false });
    return (
      <div className="space-y-4">
        <Toggle
          size="sm"
          label="Small toggle"
          checked={values.sm}
          onChange={(e) => setValues({ ...values, sm: e.target.checked })}
        />
        <Toggle
          size="md"
          label="Medium toggle"
          checked={values.md}
          onChange={(e) => setValues({ ...values, md: e.target.checked })}
        />
        <Toggle
          size="lg"
          label="Large toggle"
          checked={values.lg}
          onChange={(e) => setValues({ ...values, lg: e.target.checked })}
        />
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [values, setValues] = useState({ default: true, success: true, danger: true });
    return (
      <div className="space-y-4">
        <Toggle
          variant="default"
          label="Default variant"
          checked={values.default}
          onChange={(e) => setValues({ ...values, default: e.target.checked })}
        />
        <Toggle
          variant="success"
          label="Success variant"
          checked={values.success}
          onChange={(e) => setValues({ ...values, success: e.target.checked })}
        />
        <Toggle
          variant="danger"
          label="Danger variant"
          checked={values.danger}
          onChange={(e) => setValues({ ...values, danger: e.target.checked })}
        />
      </div>
    );
  },
};

export const SettingsExample: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false,
      marketingEmails: false,
      securityAlerts: true,
    });

    const updateSetting = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({ ...settings, [key]: e.target.checked });
    };

    return (
      <div className="w-80 p-4 border rounded-xl space-y-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">
          Notification Settings
        </h3>
        <Toggle
          label="Email notifications"
          description="Receive updates via email"
          checked={settings.emailNotifications}
          onChange={updateSetting('emailNotifications')}
        />
        <Toggle
          label="Push notifications"
          description="Receive push notifications on your device"
          checked={settings.pushNotifications}
          onChange={updateSetting('pushNotifications')}
        />
        <Toggle
          label="SMS notifications"
          description="Receive text messages for important updates"
          checked={settings.smsNotifications}
          onChange={updateSetting('smsNotifications')}
        />
        <div className="border-t pt-4 mt-4">
          <Toggle
            label="Marketing emails"
            description="Receive promotional content and offers"
            checked={settings.marketingEmails}
            onChange={updateSetting('marketingEmails')}
          />
        </div>
        <Toggle
          label="Security alerts"
          description="Get notified about security events"
          variant="success"
          checked={settings.securityAlerts}
          onChange={updateSetting('securityAlerts')}
        />
      </div>
    );
  },
};
