import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/src/lib/firebase-admin';

export async function GET(request: NextRequest) {
	try {
		// Verify Firebase ID token from Authorization header
		const authHeader = request.headers.get('authorization') || '';
		const token = authHeader.startsWith('Bearer ')
			? authHeader.substring('Bearer '.length)
			: undefined;

		if (!token) {
			return NextResponse.json({ error: 'Missing Authorization token' }, { status: 401 });
		}

		const decoded = await adminAuth.verifyIdToken(token);
		const userEmail = decoded.email;
		if (!userEmail) {
			return NextResponse.json({ error: 'Invalid token: missing email' }, { status: 401 });
		}

		// Lookup user document to get internal user id
		const usersSnapshot = await adminDb
			.collection('users')
			.where('email', '==', userEmail)
			.limit(1)
			.get();

		if (usersSnapshot.empty) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}
		const userDoc = usersSnapshot.docs[0];
		const userId = userDoc.id; // internal user doc id

		// Find requests where this user participates
		// Prefer participantIds array; fallback to requesterId/ownerId
		const requestsRef = adminDb.collection('requests');

		const [participantSnap, requesterSnap, ownerSnap] = await Promise.all([
			requestsRef.where('participantIds', 'array-contains', userId).get(),
			requestsRef.where('requesterId', '==', userId).get(),
			requestsRef.where('ownerId', '==', userId).get(),
		]);

		// Combine unique requests
		const seen = new Set<string>();
		const requestDocs = [...participantSnap.docs, ...requesterSnap.docs, ...ownerSnap.docs].filter((d) => {
			if (seen.has(d.id)) return false;
			seen.add(d.id);
			return true;
		});

		// For each request, gather last message and related item/users
		const conversations = await Promise.all(
			requestDocs.map(async (reqDoc) => {
				const reqData = reqDoc.data();

				// Last message for this request
				const messagesSnap = await adminDb
					.collection('messages')
					.where('requestId', '==', reqDoc.id)
					.orderBy('createdAt', 'desc')
					.limit(1)
					.get();

				let lastMessage = null as any;
				if (!messagesSnap.empty) {
					const msg = messagesSnap.docs[0];
					const msgData = msg.data();
					lastMessage = {
						id: msg.id,
						content: msgData.content || '',
						createdAt: (msgData.createdAt as any)?.toDate?.() || new Date(),
						sender: {
							id: msgData.senderId,
							name: msgData.senderName || 'User',
						},
					};
				}

				// Fetch item summary if available
				let itemSummary: any = { id: reqData.itemId, title: reqData.itemTitle, imageUrls: reqData.itemImages || [] };
				try {
					if (reqData.itemId) {
						const itemDoc = await adminDb.collection('items').doc(String(reqData.itemId)).get();
						if (itemDoc.exists) {
							const item = itemDoc.data();
							itemSummary = { id: itemDoc.id, title: item?.title, imageUrls: item?.imageUrls || [] };
						}
					}
				} catch {}

				// Fetch requester and owner summaries
				const [requesterDoc, ownerDoc] = await Promise.all([
					reqData.requesterId ? adminDb.collection('users').doc(String(reqData.requesterId)).get() : null,
					reqData.ownerId ? adminDb.collection('users').doc(String(reqData.ownerId)).get() : null,
				]);

				const requester = requesterDoc && requesterDoc.exists ? requesterDoc.data() : null;
				const owner = ownerDoc && ownerDoc.exists ? ownerDoc.data() : null;

				return {
					id: reqDoc.id,
					item: {
						id: itemSummary?.id,
						title: itemSummary?.title,
						imageUrls: itemSummary?.imageUrls || [],
					},
					requester: requester
						? { id: reqData.requesterId, name: requester.name || 'User', image: requester.image || null }
						: { id: reqData.requesterId, name: 'User', image: null },
					owner: owner
						? { id: reqData.ownerId, name: owner.name || 'User', image: owner.image || null }
						: { id: reqData.ownerId, name: 'User', image: null },
					status: reqData.status || 'open',
					messages: lastMessage ? [lastMessage] : [],
					_count: { messages: (reqData.messageCount as number) || (lastMessage ? 1 : 0) },
					updatedAt: (reqData.updatedAt as any)?.toDate?.() || new Date(),
				};
			})
		);

		// Sort by updatedAt desc
		conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

		return NextResponse.json(conversations);
	} catch (error) {
		console.error('GET_CONVERSATIONS_ERROR', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

