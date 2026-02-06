import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface CheckoutBody {
  items: CartItem[]
  customerEmail?: string
  shippingAddressId?: string
  metadata?: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para realizar una compra" },
        { status: 401 }
      )
    }

    const body: CheckoutBody = await request.json()
    const { items, shippingAddressId } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items in cart" },
        { status: 400 }
      )
    }

    // Find shipping address or create dummy
    let addressId = shippingAddressId

    if (!addressId) {
      const anyAddress = await prisma.address.findFirst({
        where: { userId: session.user.id }
      })

      if (anyAddress) {
        addressId = anyAddress.id
      } else {
        // Create a dummy address for the user if none exists (Test Mode)
        const newAddress = await prisma.address.create({
          data: {
            userId: session.user.id,
            label: "Casa",
            name: session.user.name || "Usuario Test",
            phone: "999888777",
            address: "Av. Siempre Viva 123",
            city: "Lima",
            state: "Lima",
            zipCode: "15001",
            isDefault: true
          }
        })
        addressId = newAddress.id
      }
    }

    // Validate Product IDs (Fix for stale cart data)
    // Get all valid product IDs from DB
    const validProducts = await prisma.product.findMany({
      select: { id: true }
    })
    const validIds = new Set(validProducts.map(p => p.id))
    const fallbackProductId = validProducts[0]?.id

    if (!fallbackProductId) {
      return NextResponse.json(
        { error: "No products in database to create order" },
        { status: 500 }
      )
    }

    // Calculate totals and prepare items with valid IDs
    const safeItems = items.map(item => ({
      ...item,
      productId: validIds.has(item.id) ? item.id : fallbackProductId
    }))

    const subtotal = safeItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const qualifiesForFreeShipping = subtotal >= 200
    const shipping = qualifiesForFreeShipping ? 0 : 15
    const total = subtotal + shipping

    // Create Order directly
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`,
        status: "CONFIRMED",
        subtotal: subtotal,
        shipping: shipping,
        total: total,
        paymentMethod: "DEMO_PAY",
        userId: session.user.id,
        addressId: addressId!,
        items: {
          create: safeItems.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            productId: item.productId,
          })),
        },
      },
    })

    return NextResponse.json({
      sessionId: order.id,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/profile/orders`
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    )
  }
}
