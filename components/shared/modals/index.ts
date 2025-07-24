// Shared Modal Components
// These are UI components that can be used across different domains
// following DDD principles for cross-cutting concerns

export { default as Modal } from './Modal'
export type { ModalProps } from './Modal'
export { 
  ModalFooter, 
  ModalActions, 
  ModalButton 
} from './Modal'