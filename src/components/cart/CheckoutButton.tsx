"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, CreditCard, LogIn, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/stores/cart-store"

export function CheckoutButton() {
    const [loading, setLoading] = useState(false)
    const items = useCartStore((state) => state.items)
    const clearCart = useCartStore((state) => state.clearCart)
    const { data: session, status } = useSession()
    const router = useRouter()

    const handleCheckout = async () => {
        if (!session) {
            router.push("/login?callbackUrl=/cart")
            return
        }

        setLoading(true)

        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map((item) => ({
                        id: item.product.id,
                        name: item.product.name,
                        price: item.product.price,
                        quantity: item.quantity,
                        image: item.product.images?.[0],
                    })),
                    customerEmail: session.user?.email,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error en el pedido")
            }

            if (data.url) {
                clearCart() // Clear cart before redirect
                window.location.href = data.url
            } else {
                throw new Error("No success URL returned")
            }
        } catch (error: any) {
            console.error("Error creating order:", error)
            alert(error.message || "Error al procesar el pedido.")
        } finally {
            setLoading(false)
        }
    }

    const isLoading = loading || status === "loading"

    return (
        <Button
            onClick={handleCheckout}
            disabled={isLoading || items.length === 0}
            className="w-full"
            size="lg"
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                </>
            ) : !session ? (
                <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar sesión para comprar
                </>
            ) : (
                <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar Compra
                </>
            )}
        </Button>
    )
}
