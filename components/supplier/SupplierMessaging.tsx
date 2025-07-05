"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Avatar,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/react";
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
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      case "high": return "danger";
      case "medium": return "warning";
      default: return "default";
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.participantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 h-96">
            <div className="bg-gray-200 rounded"></div>
            <div className="col-span-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
          <p className="text-gray-600">Comunícate directamente con compradores</p>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Lista de conversaciones */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Búsqueda */}
          <div className="p-4 border-b border-gray-200">
            <Input
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar
                      name={conversation.participantName}
                      size="md"
                      className="flex-shrink-0"
                    />
                    {conversation.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.participantName}
                        </h3>
                        {conversation.priority !== "low" && (
                          <Chip
                            size="sm"
                            color={getPriorityColor(conversation.priority)}
                            variant="flat"
                          >
                            {conversation.priority}
                          </Chip>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTimeAgo(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {conversation.title}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 truncate flex-1 mr-2">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de conversación */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header de conversación */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={selectedConversation.participantName}
                      size="md"
                    />
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.participantName}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.participantRole} - {selectedConversation.participantDepartment}
                      </p>
                    </div>
                    {selectedConversation.isOnline && (
                      <Chip size="sm" color="success" variant="flat">
                        En línea
                      </Chip>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button isIconOnly variant="light" size="sm">
                      <PhoneIcon className="w-5 h-5" />
                    </Button>
                    <Button isIconOnly variant="light" size="sm">
                      <VideoCameraIcon className="w-5 h-5" />
                    </Button>
                    <Button isIconOnly variant="light" size="sm" onPress={onOpen}>
                      <InformationCircleIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderRole === 'supplier' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${message.senderRole === 'supplier' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.senderRole === 'supplier'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${message.senderRole === 'supplier' ? 'text-right' : 'text-left'}`}>
                        {formatTimeAgo(message.timestamp)}
                      </p>
                    </div>
                    
                    {message.senderRole !== 'supplier' && (
                      <Avatar
                        name={message.senderName}
                        size="sm"
                        className="order-1 mr-2 mt-2"
                      />
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-end gap-2">
                  <Button isIconOnly variant="light" size="sm">
                    <PaperClipIcon className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escribe tu mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      minRows={1}
                      maxRows={4}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  </div>
                  
                  <Button isIconOnly variant="light" size="sm">
                    <FaceSmileIcon className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    color="primary"
                    isIconOnly
                    onPress={sendMessage}
                    isDisabled={!newMessage.trim()}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de información */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => selectedConversation && (
            <>
              <ModalHeader>
                Información de la Conversación
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Participante</h4>
                    <div className="flex items-center gap-3">
                      <Avatar name={selectedConversation.participantName} />
                      <div>
                        <p className="font-medium">{selectedConversation.participantName}</p>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.participantRole} - {selectedConversation.participantDepartment}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedConversation.orderId && (
                    <div>
                      <h4 className="font-semibold mb-2">Orden Relacionada</h4>
                      <Chip color="primary" variant="flat">
                        {selectedConversation.orderId}
                      </Chip>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Prioridad</h4>
                    <Chip color={getPriorityColor(selectedConversation.priority)} variant="flat">
                      {selectedConversation.priority}
                    </Chip>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}