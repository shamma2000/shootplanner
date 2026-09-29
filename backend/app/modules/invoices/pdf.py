import re
from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

import reportlab
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.modules.auth.model import Studio
from app.modules.clients.model import Client
from app.modules.events.model import Event
from app.modules.invoices.model import Invoice
from app.modules.quotations.model import Quotation

# Bundle the PDF library's fonts in the document, independent of server-installed fonts.
_fonts = Path(reportlab.__file__).parent / "fonts"
pdfmetrics.registerFont(TTFont("Invoice", str(_fonts / "Vera.ttf")))
pdfmetrics.registerFont(TTFont("InvoiceBold", str(_fonts / "VeraBd.ttf")))
pdfmetrics.registerFontFamily("Invoice", normal="Invoice", bold="InvoiceBold")


def invoice_filename(invoice_number: str) -> str:
    safe = re.sub(r"[^A-Za-z0-9_-]+", "-", invoice_number).strip("-")[:80]
    return f"{safe or 'invoice'}.pdf"


def _color(value: str | None, fallback: str) -> colors.Color:
    return colors.HexColor(value if value and re.fullmatch(r"#[0-9a-fA-F]{6}", value) else fallback)


def _foreground(color: colors.Color) -> colors.Color:
    channels = [
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        for c in (color.red, color.green, color.blue)
    ]
    luminance = sum(
        c * weight for c, weight in zip(channels, (0.2126, 0.7152, 0.0722), strict=True)
    )
    return colors.black if luminance > 0.179 else colors.white


def render_invoice_pdf(
    invoice: Invoice, quotation: Quotation, event: Event, client: Client, studio: Studio
) -> bytes:
    primary = _color(studio.brand_color_primary, "#f5a20b")
    secondary = _color(studio.brand_color_secondary, "#18212f")
    ink = colors.HexColor("#22272e")
    muted = colors.HexColor("#59616b")
    line = colors.HexColor("#dce1e6")
    light = colors.HexColor("#f4f6f8")
    width = A4[0] - 80
    styles = {
        "body": ParagraphStyle(
            "body", fontName="Invoice", fontSize=9, leading=12, textColor=ink, spaceAfter=1
        ),
        "small": ParagraphStyle(
            "small", fontName="Invoice", fontSize=8, leading=11, textColor=muted
        ),
        "bold": ParagraphStyle(
            "bold", fontName="InvoiceBold", fontSize=10, leading=14, textColor=ink
        ),
        "title": ParagraphStyle(
            "title",
            fontName="InvoiceBold",
            fontSize=21,
            leading=27,
            textColor=_foreground(secondary),
        ),
        "right": ParagraphStyle(
            "right", fontName="Invoice", fontSize=9, leading=13, alignment=TA_RIGHT, textColor=ink
        ),
        "head": ParagraphStyle(
            "head", fontName="InvoiceBold", fontSize=8, leading=12, textColor=_foreground(secondary)
        ),
        "section": ParagraphStyle(
            "section",
            fontName="InvoiceBold",
            fontSize=10,
            leading=14,
            textColor=ink,
            spaceBefore=11,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "balance": ParagraphStyle(
            "balance",
            fontName="InvoiceBold",
            fontSize=13,
            leading=18,
            textColor=_foreground(primary),
        ),
    }
    styles["head_right"] = ParagraphStyle("head_right", parent=styles["head"], alignment=TA_RIGHT)
    styles["balance_right"] = ParagraphStyle(
        "balance_right", parent=styles["balance"], alignment=TA_RIGHT
    )

    def p(value: object, style: str = "body") -> Paragraph:
        # User-provided notes and names must never become ReportLab markup or image URLs.
        text = escape(str(value or "")).replace("\r\n", "\n").replace("\n", "<br/>")
        return Paragraph(text, styles[style])

    def money(value: Decimal) -> str:
        return f"LKR {value:,.2f}"

    def amount(value: Decimal, available_width: float, style: str = "right") -> Paragraph:
        text = money(value)
        base = styles[style]
        text_width = pdfmetrics.stringWidth(text, base.fontName, base.fontSize)
        size = base.fontSize * min(1, available_width / text_width)
        return Paragraph(text, ParagraphStyle("amount", parent=base, fontSize=size))

    def day(value: date) -> str:
        return value.strftime("%d %b %Y")

    def table(data, widths, commands=(), repeat=0):
        result = Table(data, colWidths=widths, repeatRows=repeat, hAlign="LEFT", splitInRow=1)
        result.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    *commands,
                ]
            )
        )
        return result

    def details(heading, values):
        return [p(heading, "small"), *[p(value) for value in values if value]]

    balance = invoice.balance_due
    payment_status = (
        "Paid in full"
        if balance == 0
        else "Overdue"
        if invoice.due_date < date.today()
        else "Part paid"
        if invoice.advance_paid
        else "Awaiting payment"
    )
    story = [
        table(
            [[p(studio.name, "title"), p("INVOICE", "title")]],
            [width * 0.63, width * 0.37],
            [
                ("BACKGROUND", (0, 0), (-1, -1), secondary),
                ("LINEBELOW", (0, 0), (-1, -1), 4, primary),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
            ],
        ),
        Spacer(1, 12),
        table(
            [
                [
                    details("INVOICE NUMBER", [invoice.invoice_number]),
                    details("ISSUED", [day(invoice.created_at.date())]),
                    details("PAYMENT DUE", [day(invoice.due_date)]),
                ]
            ],
            [width * 0.42, width * 0.29, width * 0.29],
        ),
        table(
            [
                [
                    details("FROM", [studio.name, studio.phone, studio.email, studio.address]),
                    details(
                        "BILL TO",
                        [
                            " & ".join(
                                name for name in (client.bride_name, client.groom_name) if name
                            ),
                            client.primary_phone,
                            client.optional_phone,
                            client.email,
                            client.address,
                        ],
                    ),
                ]
            ],
            [width / 2, width / 2],
            [("BACKGROUND", (0, 0), (-1, -1), light)],
        ),
        p("Event & service", "section"),
        table(
            [
                [
                    details("EVENT", [event.event_type, day(event.event_date), event.status]),
                    details("VENUE", [event.location, event.hotel]),
                    details(
                        "PACKAGE / SERVICE",
                        [
                            quotation.package_name,
                            "Photography & Videography"
                            if quotation.service_type == "Both"
                            else quotation.service_type,
                        ],
                    ),
                ]
            ],
            [width / 3] * 3,
            [("LINEBELOW", (0, 0), (-1, -1), 0.5, line)],
        ),
    ]
    if event.status == "Postponed":
        for label, value in (
            ("Original date", event.original_date),
            ("Tentative date", event.tentative_date),
        ):
            if value:
                story.append(p(f"{label}: {day(value)}"))
        if event.postpone_reason:
            story.append(p(event.postpone_reason))

    story.append(p("Services & items", "section"))
    rows = [
        [
            p("DESCRIPTION", "head"),
            *[p(text, "head_right") for text in ("QTY", "UNIT PRICE", "AMOUNT")],
        ]
    ]
    item_order = {"package": 0, "custom": 1, "add_on": 2, "transport": 3, "deliverable": 4}
    items = sorted(
        quotation.items,
        key=lambda item: (item_order.get(item.item_type, 5), item.created_at, str(item.id)),
    )
    for item in items:
        category = item.item_type.replace("_", " ").title()
        if item.category:
            category += f" / {item.category}"
        rows.append(
            [
                [p(item.name), p(category, "small")],
                p(item.quantity, "right"),
                amount(item.unit_price, 85),
                amount(item.total, 85),
            ]
        )
    if not items:
        rows.append(
            [
                p(quotation.package_name or "Photography / videography services"),
                p("1", "right"),
                amount(quotation.subtotal, 85),
                amount(quotation.subtotal, 85),
            ]
        )
    story.append(
        table(
            rows,
            [width - 255, 45, 105, 105],
            [
                ("BACKGROUND", (0, 0), (-1, 0), secondary),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light]),
                ("LINEBELOW", (0, -1), (-1, -1), 0.5, line),
            ],
            repeat=1,
        )
    )

    totals = [("Subtotal", quotation.subtotal), ("Discount", -quotation.discount)]
    # Manual invoice amounts and capped discounts must still reconcile to the stored invoice total.
    adjustment = invoice.amount - (quotation.subtotal - quotation.discount)
    if adjustment:
        totals.append(("Invoice adjustment", adjustment))
    totals.extend(
        [("Invoice total", invoice.amount), ("Advance / payments received", invoice.advance_paid)]
    )
    bank = [
        ("Bank", studio.bank_name),
        ("Account holder", studio.bank_account_holder),
        ("Account number", studio.bank_account_number),
        ("Branch", studio.bank_branch),
    ]
    bank_details = []
    if any(value for _, value in bank):
        bank_details = [p("Bank transfer details", "bold"), Spacer(1, 7)]
        bank_details.extend(p(f"{label}: {value}") for label, value in bank if value)
        bank_details.append(p(f"Payment reference: {invoice.invoice_number}"))
    totals_table = table(
        [[p(label), amount(value, 115)] for label, value in totals],
        [width * 0.55 - 135, 115],
        [
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ],
    )
    story.append(
        KeepTogether(
            [
                Spacer(1, 12),
                table([[bank_details, totals_table]], [width * 0.45, width * 0.55]),
                table(
                    [
                        [
                            p(f"BALANCE DUE  /  {payment_status}", "balance"),
                        amount(balance, 155, "balance_right"),
                        ]
                    ],
                    [width - 175, 175],
                    [("BACKGROUND", (0, 0), (-1, -1), primary)],
                ),
            ]
        )
    )

    if invoice.deliveries:
        story.append(p("Deliverables", "section"))
        delivery_rows = [[p(text, "head") for text in ("ITEM", "STATUS", "DUE / DELIVERED")]]
        for delivery in sorted(
            invoice.deliveries, key=lambda item: (item.created_at, str(item.id))
        ):
            dates = []
            if delivery.due_date:
                dates.append(f"Due: {day(delivery.due_date)}")
            if delivery.delivered_at:
                dates.append(f"Delivered: {day(delivery.delivered_at.date())}")
            delivery_rows.append([p(delivery.name), p(delivery.status), p("\n".join(dates))])
        story.append(
            table(
                delivery_rows,
                [width * 0.45, width * 0.2, width * 0.35],
                [
                    ("BACKGROUND", (0, 0), (-1, 0), secondary),
                    ("LINEBELOW", (0, 1), (-1, -1), 0.5, line),
                ],
                repeat=1,
            )
        )
    if invoice.notes:
        story.extend([p("Notes", "section"), p(invoice.notes)])
    if quotation.notes and quotation.notes != invoice.notes:
        story.extend([p("Quotation notes", "section"), p(quotation.notes)])
    story.extend([Spacer(1, 16), p("Thank you for choosing " + studio.name + ".", "small")])

    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(line)
        canvas.line(40, 36, A4[0] - 40, 36)
        canvas.setFont("Invoice", 8)
        canvas.setFillColor(muted)
        canvas.drawString(40, 23, invoice_filename(invoice.invoice_number).removesuffix(".pdf"))
        canvas.drawRightString(A4[0] - 40, 23, f"Page {document.page}")
        canvas.restoreState()

    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=32,
        bottomMargin=50,
        title=f"Invoice {invoice.invoice_number}",
        author=studio.name,
    )
    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return output.getvalue()
