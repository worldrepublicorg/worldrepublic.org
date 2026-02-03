"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  Form,
  Input,
  TextArea,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import type { FocusEvent as ReactFocusEvent } from "react";
import { PiPencilSimpleFill, PiPlusCircleFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { CreatePartyData } from "@/lib/types/parties";

const MAX_STRING_LENGTH = 256;

interface CreateUpdatePartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  formData: CreatePartyData;
  onFormDataChange: (data: CreatePartyData) => void;
  onConfirm: () => void;
  isProcessing?: boolean;
  onInputFocus?: (e: ReactFocusEvent) => void;
  isAuthenticated?: boolean;
  onSignInRequired?: () => void;
  dictionary: Dictionary;
}

export function CreateUpdatePartyDialog({
  open,
  onOpenChange,
  mode,
  formData,
  onFormDataChange,
  onConfirm,
  isProcessing = false,
  onInputFocus,
  isAuthenticated,
  onSignInRequired,
  dictionary,
}: CreateUpdatePartyDialogProps) {
  const isCreate = mode === "create";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For create mode, check authentication before proceeding
    if (isCreate && isAuthenticated === false && onSignInRequired) {
      onSignInRequired();
      return;
    }
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              {isCreate ? (
                <PiPlusCircleFill className="h-[30px] w-[30px] text-gray-400" />
              ) : (
                <PiPencilSimpleFill className="h-[30px] w-[30px] text-gray-400" />
              )}
            </div>
          }
        >
          <Typography variant="heading" level={3}>
            {isCreate
              ? dictionary.pages.govern.parties.dialogs.found_party
              : dictionary.pages.govern.parties.edit_party_info}
          </Typography>
        </AlertDialogHeader>
        <Form.Root onSubmit={handleSubmit}>
          <AlertDialogDescription>
            <Form.Field name="name">
              <Form.Control asChild>
                <Input
                  variant="floating-label"
                  label={dictionary.pages.govern.parties.dialogs.party_name}
                  value={formData.name}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  onFocus={onInputFocus}
                  required
                  maxLength={MAX_STRING_LENGTH}
                />
              </Form.Control>
            </Form.Field>

            <Form.Field name="description" className="mt-2">
              <div className="[&_textarea]:text-[15px]! [&_textarea]:text-gray-900! [&_textarea::placeholder]:text-[15px]! [&_label]:text-sm">
                <Form.Control asChild>
                  <TextArea
                    variant="floating-label"
                    label={
                      dictionary.pages.govern.parties.dialogs
                        .description_optional
                    }
                    value={formData.description}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    onFocus={onInputFocus}
                    maxLength={MAX_STRING_LENGTH}
                  />
                </Form.Control>
              </div>
            </Form.Field>

            <Form.Field name="websiteUrl" className="mt-2">
              <Form.Control asChild>
                <Input
                  variant="floating-label"
                  label={
                    dictionary.pages.govern.parties.dialogs
                      .official_link_optional
                  }
                  value={formData.websiteUrl}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      websiteUrl: e.target.value,
                    })
                  }
                  onFocus={onInputFocus}
                  maxLength={MAX_STRING_LENGTH}
                />
              </Form.Control>
            </Form.Field>
          </AlertDialogDescription>

          <AlertDialogFooter>
            <Form.Submit asChild>
              <Button variant="primary" fullWidth disabled={isProcessing}>
                {isProcessing
                  ? isCreate
                    ? dictionary.pages.govern.parties.dialogs.founding
                    : dictionary.pages.govern.parties.dialogs.updating
                  : isCreate
                    ? dictionary.pages.govern.parties.dialogs.found
                    : dictionary.pages.govern.parties.dialogs.save}
              </Button>
            </Form.Submit>
          </AlertDialogFooter>
        </Form.Root>
      </AlertDialogContent>
    </AlertDialog>
  );
}
