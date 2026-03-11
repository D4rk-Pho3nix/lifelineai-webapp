"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, MessageSquare, MoreHorizontal, Edit, Trash2, Bookmark } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import type { ChatSession } from "@/app/page"
import { cn } from "@/lib/utils"
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  searchQuery: string
  onSearchChange: (query: string) => void
  onSessionSelect: (sessionId: string) => void
  onNewChat: () => void
  onRenameSession: (sessionId: string, newTitle: string) => void
  onDeleteSession: (sessionId: string) => void
  onToggleBookmark: (sessionId: string) => void
  session: { user: { id?: string; phone?: string | null; name?: string | null; email?: string | null; countryCode?: string } } | null
}

export function ChatSidebar({
  sessions,
  currentSessionId,
  searchQuery,
  onSearchChange,
  onSessionSelect,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  onToggleBookmark,
  session,
}: ChatSidebarProps) {
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const router = useRouter()

  const handleRenameSubmit = (sessionId: string) => {
    if (renameValue.trim()) {
      onRenameSession(sessionId, renameValue.trim())
    }
    setRenamingSessionId(null)
    setRenameValue("")
  }

  const handleRenameStart = (session: ChatSession) => {
    setRenamingSessionId(session.id)
    setRenameValue(session.title)
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 bottom-0 h-screen flex-shrink-0 z-20">
      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-accent border border-sidebar-border text-sm font-medium"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-background border-border text-sm"
          />
        </div>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent",
                    currentSessionId === session.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  {renamingSessionId === session.id ? (
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleRenameSubmit(session.id)
                        } else if (e.key === "Escape") {
                          setRenamingSessionId(null)
                          setRenameValue("")
                        }
                      }}
                      onBlur={() => handleRenameSubmit(session.id)}
                      className="flex-1 h-6 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      {session.pinned && <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      <Button
                        variant="ghost"
                        onClick={() => onSessionSelect(session.id)}
                        className="flex-1 justify-start text-left p-0 h-auto hover:bg-transparent text-sm font-normal"
                      >
                        <div className="truncate">{session.title}</div>
                      </Button>

                      <DropdownMenu
                        open={openMenuId === session.id}
                        onOpenChange={(isOpen) => setOpenMenuId(isOpen ? session.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="h-6 w-6 p-0 z-10 opacity-0 group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          sideOffset={4}
                          className="w-40"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          <DropdownMenuItem
                            onSelect={() => handleRenameStart(session)}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Edit className="h-3 w-3" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => onToggleBookmark(session.id)}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Bookmark
                              className={cn("h-3 w-3", session.pinned ? "text-yellow-500 fill-yellow-500" : "")}
                            />
                            {session.pinned ? "Remove bookmark" : "Bookmark"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => onDeleteSession(session.id)}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Info and Logout */}
      {session?.user && (
        <div className="p-3 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              {session.user.name?.[0] || session.user.email?.[0] || "U"}
            </div>
            <div className="text-sm font-medium text-foreground truncate">
              {session.user.name || session.user.email}
            </div>
          </div>
          <Button onClick={() => signOut(auth).then(() => router.push('/login'))} className="w-full" variant="secondary">
            Sign out
          </Button>
        </div>
      )}
    </div>
  )
}
