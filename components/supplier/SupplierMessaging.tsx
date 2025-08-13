"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paper,
  Button,
  TextInput,
  Avatar,
  Badge,
  Menu,
  Textarea,
  Modal,
  Group,
  Stack,
  Text,
  Title,
  ActionIcon,
  Center,
  Loader,
  ScrollArea,
  Divider
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  PaperClipIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  VideoCameraIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "supplier" | "buyer";
  content: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  isRead: boolean;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
}

interface Conversation {
  id: string;
  title: string;
  participantName: string;
  participantRole: string;
  participantDepartment?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  orderId?: string;
  priority: "low" | "medium" | "high";
}

interface SupplierMessagingProps {
  supplierId: string;
}

export default function SupplierMessaging({ supplierId }: SupplierMessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [opened, { open, close }] = useDisclosure(false);

  useEffect(() => {
    fetchConversations();
  }, [supplierId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // Mock data for demonstration
      const mockConversations: Conversation[] = [
        {
          id: "conv-1",
          title: "Orden #PO-2024-001",
          participantName: "María González",
          participantRole: "Comprador",
          participantDepartment: "IT",
          lastMessage: "¿Cuándo estará disponible el producto?",
          lastMessageTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          unreadCount: 2,
          isOnline: true,
          orderId: "PO-2024-001",
          priority: "high"
        },
        {
          id: "conv-2",
          title: "Consulta General",
          participantName: "Carlos Ruiz",
          participantRole: "Gerente de Compras",
          participantDepartment: "Administración",
          lastMessage: "Perfecto, muchas gracias por la información.",
          lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          unreadCount: 0,
          isOnline: false,
          priority: "medium"
        },
        {
          id: "conv-3",
          title: "Orden #PO-2024-002",
          participantName: "Ana Martínez",
          participantRole: "Coordinadora",
          participantDepartment: "Logística",
          lastMessage: "Necesitamos acelerar la entrega por favor.",
          lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          unreadCount: 1,
          isOnline: true,
          orderId: "PO-2024-002",
          priority: "high"
        }
      ];
      
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // Mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: "msg-1",
          conversationId,
          senderId: "user-buyer-1",
          senderName: "María González",
          senderRole: "buyer",
          content: "Hola, tengo una pregunta sobre la orden #PO-2024-001. ¿Podrías confirmar la fecha de entrega?",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: "text",
          isRead: true
        },
        {
          id: "msg-2",
          conversationId,
          senderId: supplierId,
          senderName: "Proveedor",
          senderRole: "supplier",
          content: "¡Hola María! Claro, la fecha estimada de entrega es el próximo viernes 15 de diciembre. Te mantendré informada de cualquier cambio.",
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          type: "text",
          isRead: true
        },
        {
          id: "msg-3",
          conversationId,
          senderId: "user-buyer-1",
          senderName: "María González",
          senderRole: "buyer",
          content: "¿Cuándo estará disponible el producto?",
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          type: "text",
          isRead: false
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: supplierId,
      senderName: "Proveedor",
      senderRole: "supplier",
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      isRead: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Update conversation last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }
          : conv
      )
    );

    // In production, this would send the message to the API
    try {
      await fetch(`/api/supplier/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage,
          supplierId
        })
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: es
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "red";
      case "medium": return "yellow";
      default: return "gray";
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', padding: '1.5rem' }}>
        <Stack gap="md">
          <div style={{ height: '2rem', backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-sm)', width: '25%' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', height: '24rem' }}>
            <div style={{ backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-sm)' }}></div>
            <div style={{ backgroundColor: 'var(--mantine-color-gray-2)', borderRadius: 'var(--mantine-radius-sm)' }}></div>
          </div>
        </Stack>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)' }}>
      {/* Header */}
      <Paper shadow="sm" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <div style={{ padding: '1rem 1.5rem' }}>
          <Title order={2}>Mensajes</Title>
          <Text c="dimmed">Comunícate directamente con compradores</Text>
        </div>
      </Paper>

      <div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>
        {/* Lista de conversaciones */}
        <div style={{ width: '33.333333%', backgroundColor: 'white', borderRight: '1px solid var(--mantine-color-gray-3)', display: 'flex', flexDirection: 'column' }}>
          {/* Búsqueda */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <TextInput
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              leftSection={<MagnifyingGlassIcon className="w-4 h-4" />}
            />
          </div>

          {/* Lista */}
          <ScrollArea style={{ flex: 1 }}>
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--mantine-color-gray-1)',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conversation.id ? 'var(--mantine-color-blue-0)' : 'transparent',
                  borderLeft: selectedConversation?.id === conversation.id ? '4px solid var(--mantine-color-blue-5)' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conversation.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Group align="flex-start" gap="md">
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      name={conversation.participantName}
                      size="md"
                      style={{ flexShrink: 0 }}
                    />
                    {conversation.isOnline && (
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        right: 0, 
                        width: '0.75rem', 
                        height: '0.75rem', 
                        backgroundColor: '#22c55e', 
                        borderRadius: '50%', 
                        border: '2px solid white' 
                      }}></div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group justify="space-between" align="flex-start" mb="xs">
                      <Group gap="xs">
                        <Text fw={500} truncate>
                          {conversation.participantName}
                        </Text>
                        {conversation.priority !== "low" && (
                          <Badge
                            size="sm"
                            color={getPriorityColor(conversation.priority)}
                            variant="light"
                          >
                            {conversation.priority}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                        {formatTimeAgo(conversation.lastMessageTime)}
                      </Text>
                    </Group>
                    
                    <Text size="sm" c="dimmed" mb="xs">
                      {conversation.title}
                    </Text>
                    
                    <Group justify="space-between" align="center">
                      <Text size="sm" c="dimmed" truncate style={{ flex: 1, marginRight: '0.5rem' }}>
                        {conversation.lastMessage}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <Badge
                          size="sm"
                          color="red"
                          variant="filled"
                          style={{ 
                            minWidth: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Área de conversación */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Header de conversación */}
              <Paper shadow="none" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)', padding: '1rem 1.5rem' }}>
                <Group justify="space-between">
                  <Group gap="md">
                    <Avatar
                      name={selectedConversation.participantName}
                      size="md"
                    />
                    <div>
                      <Text fw={600}>
                        {selectedConversation.participantName}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {selectedConversation.participantRole} - {selectedConversation.participantDepartment}
                      </Text>
                    </div>
                    {selectedConversation.isOnline && (
                      <Badge size="sm" color="green" variant="light">
                        En línea
                      </Badge>
                    )}
                  </Group>
                  
                  <Group gap="xs">
                    <ActionIcon variant="light" size="sm">
                      <PhoneIcon className="w-5 h-5" />
                    </ActionIcon>
                    <ActionIcon variant="light" size="sm">
                      <VideoCameraIcon className="w-5 h-5" />
                    </ActionIcon>
                    <ActionIcon variant="light" size="sm" onClick={open}>
                      <InformationCircleIcon className="w-5 h-5" />
                    </ActionIcon>
                  </Group>
                </Group>
              </Paper>

              {/* Mensajes */}
              <ScrollArea style={{ flex: 1, padding: '1.5rem' }}>
                <Stack gap="md">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        display: 'flex',
                        justifyContent: message.senderRole === 'supplier' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ 
                        maxWidth: '24rem', 
                        order: message.senderRole === 'supplier' ? 2 : 1 
                      }}>
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--mantine-radius-lg)',
                            backgroundColor: message.senderRole === 'supplier' 
                              ? 'var(--mantine-color-blue-5)' 
                              : 'var(--mantine-color-gray-2)',
                            color: message.senderRole === 'supplier' ? 'white' : 'var(--mantine-color-dark-9)'
                          }}
                        >
                          <Text size="sm">{message.content}</Text>
                        </div>
                        <Text 
                          size="xs" 
                          c="dimmed" 
                          mt="xs"
                          style={{ 
                            textAlign: message.senderRole === 'supplier' ? 'right' : 'left' 
                          }}
                        >
                          {formatTimeAgo(message.timestamp)}
                        </Text>
                      </div>
                      
                      {message.senderRole !== 'supplier' && (
                        <Avatar
                          name={message.senderName}
                          size="sm"
                          style={{ order: 1, marginRight: '0.5rem', marginTop: '0.5rem' }}
                        />
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </Stack>
              </ScrollArea>

              {/* Input de mensaje */}
              <Paper shadow="none" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', padding: '1rem' }}>
                <Group align="flex-end" gap="sm">
                  <ActionIcon variant="light" size="sm">
                    <PaperClipIcon className="w-5 h-5" />
                  </ActionIcon>
                  
                  <div style={{ flex: 1 }}>
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.currentTarget.value)}
                      minRows={1}
                      maxRows={4}
                      autosize
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  
                  <ActionIcon variant="light" size="sm">
                    <FaceSmileIcon className="w-5 h-5" />
                  </ActionIcon>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    px="xs"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </Button>
                </Group>
              </Paper>
            </>
          ) : (
            <Center style={{ flex: 1, backgroundColor: 'var(--mantine-color-gray-0)' }}>
              <Stack align="center" gap="md">
                <ChatBubbleLeftIcon style={{ width: '4rem', height: '4rem', color: 'var(--mantine-color-gray-4)' }} />
                <Text c="dimmed">Selecciona una conversación para comenzar</Text>
              </Stack>
            </Center>
          )}
        </div>
      </div>

      {/* Modal de información */}
      <Modal opened={opened} onClose={close} title="Información de la Conversación">
        {selectedConversation && (
          <Stack gap="md">
            <div>
              <Text fw={600} mb="sm">Participante</Text>
              <Group gap="md">
                <Avatar name={selectedConversation.participantName} />
                <div>
                  <Text fw={500}>{selectedConversation.participantName}</Text>
                  <Text size="sm" c="dimmed">
                    {selectedConversation.participantRole} - {selectedConversation.participantDepartment}
                  </Text>
                </div>
              </Group>
            </div>
            
            {selectedConversation.orderId && (
              <div>
                <Text fw={600} mb="sm">Orden Relacionada</Text>
                <Badge variant="light">
                  {selectedConversation.orderId}
                </Badge>
              </div>
            )}
            
            <div>
              <Text fw={600} mb="sm">Prioridad</Text>
              <Badge color={getPriorityColor(selectedConversation.priority)} variant="light">
                {selectedConversation.priority}
              </Badge>
            </div>

            <Group justify="flex-end" mt="lg">
              <Button variant="light" onClick={close}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </div>
  );
}