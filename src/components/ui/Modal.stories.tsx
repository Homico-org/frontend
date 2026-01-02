import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { AlertTriangle, Trash2, CheckCircle, Info, AlertCircle, BriefcaseBusiness } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalActions, ConfirmModal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

// Interactive wrapper for modal stories
function ModalDemo({ children }: { children: (props: { isOpen: boolean; setIsOpen: (open: boolean) => void }) => React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#C4735B] text-white rounded-lg hover:bg-[#B5624A] transition-colors"
      >
        Open Modal
      </button>
      {children({ isOpen, setIsOpen })}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            title="Modal Title"
            description="This is a description for the modal."
          />
          <ModalBody>
            <p className="text-neutral-600 dark:text-neutral-400">
              Modal content goes here. You can put any content inside the modal body.
            </p>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Confirm"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const DangerVariant: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
            title="Delete Account"
            description="This action is irreversible and will delete all your data."
            variant="danger"
          />
          <ModalBody>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Delete"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="danger"
              confirmIcon={<Trash2 className="w-4 h-4" />}
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const WarningVariant: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            icon={<BriefcaseBusiness className="w-8 h-8 text-yellow-600" />}
            title="Pause Profile"
            description="Your profile will be temporarily hidden from clients."
            variant="warning"
          />
          <ModalBody>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Pause"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="warning"
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const SuccessVariant: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            icon={<CheckCircle className="w-8 h-8 text-green-500" />}
            title="Success!"
            description="Your changes have been saved successfully."
            variant="success"
          />
          <ModalBody>
            <ModalActions
              cancelLabel="Close"
              confirmLabel="Continue"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="success"
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const InfoVariant: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            icon={<Info className="w-8 h-8 text-blue-500" />}
            title="Information"
            description="Here's some important information you should know."
            variant="info"
          />
          <ModalBody>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              You can add any additional content here to provide more details to the user.
            </p>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Got it"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="info"
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const AccentVariant: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <ModalHeader
            icon={<AlertCircle className="w-8 h-8 text-[#C4735B]" />}
            title="Confirm Action"
            description="Are you sure you want to proceed with this action?"
            variant="accent"
          />
          <ModalBody>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Proceed"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="accent"
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};

export const WithLoading: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);

    return (
      <ModalDemo>
        {({ isOpen, setIsOpen }) => (
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} preventClose={isLoading}>
            <ModalHeader
              icon={<Trash2 className="w-8 h-8 text-red-500" />}
              title="Delete Item"
              description="This will permanently delete the item."
              variant="danger"
            />
            <ModalBody>
              <ModalActions
                cancelLabel="Cancel"
                confirmLabel="Delete"
                loadingLabel="Deleting..."
                onCancel={() => setIsOpen(false)}
                onConfirm={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    setIsOpen(false);
                  }, 2000);
                }}
                isLoading={isLoading}
                variant="danger"
                confirmIcon={<Trash2 className="w-4 h-4" />}
              />
            </ModalBody>
          </Modal>
        )}
      </ModalDemo>
    );
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <ModalDemo>
        {({ isOpen, setIsOpen }) => (
          <>
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            >
              Small
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
              <ModalHeader title="Small Modal" />
              <ModalBody>
                <p className="text-sm text-neutral-600">Small modal content</p>
                <ModalActions
                  onCancel={() => setIsOpen(false)}
                  onConfirm={() => setIsOpen(false)}
                />
              </ModalBody>
            </Modal>
          </>
        )}
      </ModalDemo>
      <ModalDemo>
        {({ isOpen, setIsOpen }) => (
          <>
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            >
              Large
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="lg">
              <ModalHeader title="Large Modal" />
              <ModalBody>
                <p className="text-sm text-neutral-600">Large modal content with more space</p>
                <ModalActions
                  onCancel={() => setIsOpen(false)}
                  onConfirm={() => setIsOpen(false)}
                />
              </ModalBody>
            </Modal>
          </>
        )}
      </ModalDemo>
      <ModalDemo>
        {({ isOpen, setIsOpen }) => (
          <>
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg"
            >
              Extra Large
            </button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
              <ModalHeader title="Extra Large Modal" />
              <ModalBody>
                <p className="text-sm text-neutral-600">Extra large modal content with maximum space</p>
                <ModalActions
                  onCancel={() => setIsOpen(false)}
                  onConfirm={() => setIsOpen(false)}
                />
              </ModalBody>
            </Modal>
          </>
        )}
      </ModalDemo>
    </div>
  ),
};

export const ConfirmModalComponent: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <ConfirmModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onConfirm={() => setIsOpen(false)}
          title="Confirm Action"
          description="Are you sure you want to proceed?"
          icon={<AlertCircle className="w-8 h-8 text-[#C4735B]" />}
          cancelLabel="Cancel"
          confirmLabel="Confirm"
        />
      )}
    </ModalDemo>
  ),
};

export const WithCustomContent: Story = {
  render: () => (
    <ModalDemo>
      {({ isOpen, setIsOpen }) => (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} showCloseButton>
          <ModalHeader
            icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
            title="Delete Account"
            description="This action is irreversible."
            variant="danger"
          />
          <ModalBody className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">This will permanently delete:</p>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Your profile and personal information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  All posted jobs and proposals
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Messages and reviews
                </li>
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Type &quot;DELETE&quot; to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-xl border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-mono text-center tracking-widest"
              />
            </div>
            <ModalActions
              cancelLabel="Cancel"
              confirmLabel="Delete Account"
              onCancel={() => setIsOpen(false)}
              onConfirm={() => setIsOpen(false)}
              variant="danger"
              confirmIcon={<Trash2 className="w-4 h-4" />}
            />
          </ModalBody>
        </Modal>
      )}
    </ModalDemo>
  ),
};
