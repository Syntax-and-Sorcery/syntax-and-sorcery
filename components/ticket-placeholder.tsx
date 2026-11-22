// placeholder for ticket stubs that aren't built yet, so the screens around them still work
export function TicketPlaceholder({ ticket, name }: { ticket: string; name: string }) {
  return (
    <div className="border-2 border-dashed border-muted-foreground/50 p-3 text-xs text-muted-foreground">
      {`TODO ${ticket} ${name}`}
    </div>
  );
}
