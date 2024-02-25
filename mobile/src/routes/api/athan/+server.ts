import { json } from "@sveltejs/kit";


export async function GET() {
    //use supabase
    return json(
        {
            message: 'WORKING ON IT...',
            retryIn: 500,
        },
        {
            status: 202
        }
    )
}