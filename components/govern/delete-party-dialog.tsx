"use client";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	Button,
	Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { PiTrashFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Party } from "@/lib/types/parties";

interface DeletePartyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	party: Party | null;
	onConfirm: () => void;
	isProcessing?: boolean;
	dictionary: Dictionary;
}

export function DeletePartyDialog({
	open,
	onOpenChange,
	party,
	onConfirm,
	isProcessing = false,
	dictionary,
}: DeletePartyDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader
					icon={
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
							<PiTrashFill className="h-[30px] w-[30px] text-gray-400" />
						</div>
					}
				>
					<Typography variant="heading" level={3}>
						{dictionary.pages.govern.parties.delete_party}
					</Typography>
				</AlertDialogHeader>
				<AlertDialogDescription>
					{party && (
						<p>
							{dictionary.pages.govern.parties.dialogs.about_to_delete.replace(
								"{partyName}",
								party.name,
							)}
						</p>
					)}
				</AlertDialogDescription>
				<AlertDialogFooter>
					<AlertDialogClose asChild>
						<Button
							variant="primary"
							fullWidth
							onClick={onConfirm}
							disabled={isProcessing}
							className="bg-error-600"
						>
							{isProcessing
								? dictionary.pages.govern.parties.dialogs.deleting
								: dictionary.common.confirm}
						</Button>
					</AlertDialogClose>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
