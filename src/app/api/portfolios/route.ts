import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { Portfolio, Formation, PortfolioPlayer } from '@/types';

// GET - Fetch portfolios (optionally by user_id)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const portfolioId = searchParams.get('id');

    let query = supabase.from('portfolios').select('*');

    if (portfolioId) {
      query = query.eq('id', portfolioId);
    } else if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Return public portfolios
      query = query.eq('is_public', true);
    }

    const { data: portfolios, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Convert to app format
    const formattedPortfolios: Portfolio[] = portfolios.map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      description: p.description,
      formation: p.formation as Formation,
      players: typeof p.players === 'string' ? JSON.parse(p.players) : p.players,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      isPublic: p.is_public,
      likes: [],
      clonedFrom: p.cloned_from,
      cloneCount: p.clone_count,
      tags: p.tags || [],
    }));

    // Fetch likes for each portfolio
    for (const portfolio of formattedPortfolios) {
      const { data: likes } = await supabase
        .from('portfolio_likes')
        .select('user_id')
        .eq('portfolio_id', portfolio.id);
      portfolio.likes = likes?.map(l => l.user_id) || [];
    }

    return NextResponse.json({ success: true, portfolios: formattedPortfolios });
  } catch (error) {
    console.error('Fetch portfolios error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch portfolios' }, { status: 500 });
  }
}

// POST - Create a new portfolio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, formation, players, isPublic, tags } = body;

    if (!userId || !name || !formation) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user's team limit
    const { data: user } = await supabase
      .from('users')
      .select('max_teams')
      .eq('id', userId)
      .single();

    const { data: existingPortfolios } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId);

    const maxTeams = user?.max_teams || 3;
    if (existingPortfolios && existingPortfolios.length >= maxTeams) {
      return NextResponse.json(
        { success: false, error: 'Team limit reached. Unlock more slots with XP.' },
        { status: 400 }
      );
    }

    const portfolioId = uuidv4();
    const now = new Date().toISOString();

    const { data: newPortfolio, error } = await supabase
      .from('portfolios')
      .insert({
        id: portfolioId,
        user_id: userId,
        name,
        description: description || '',
        formation,
        players: JSON.stringify(players || []),
        is_public: isPublic !== false,
        tags: tags || [],
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const portfolio: Portfolio = {
      id: newPortfolio.id,
      userId: newPortfolio.user_id,
      name: newPortfolio.name,
      description: newPortfolio.description,
      formation: newPortfolio.formation as Formation,
      players: typeof newPortfolio.players === 'string'
        ? JSON.parse(newPortfolio.players)
        : newPortfolio.players,
      createdAt: newPortfolio.created_at,
      updatedAt: newPortfolio.updated_at,
      isPublic: newPortfolio.is_public,
      likes: [],
      clonedFrom: newPortfolio.cloned_from,
      cloneCount: newPortfolio.clone_count,
      tags: newPortfolio.tags || [],
    };

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Create portfolio error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create portfolio' }, { status: 500 });
  }
}

// PUT - Update a portfolio
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, formation, players, isPublic, tags } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Portfolio ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (formation !== undefined) updateData.formation = formation;
    if (players !== undefined) updateData.players = JSON.stringify(players);
    if (isPublic !== undefined) updateData.is_public = isPublic;
    if (tags !== undefined) updateData.tags = tags;

    const { data: updated, error } = await supabase
      .from('portfolios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const portfolio: Portfolio = {
      id: updated.id,
      userId: updated.user_id,
      name: updated.name,
      description: updated.description,
      formation: updated.formation as Formation,
      players: typeof updated.players === 'string' ? JSON.parse(updated.players) : updated.players,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      isPublic: updated.is_public,
      likes: [],
      clonedFrom: updated.cloned_from,
      cloneCount: updated.clone_count,
      tags: updated.tags || [],
    };

    return NextResponse.json({ success: true, portfolio });
  } catch (error) {
    console.error('Update portfolio error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update portfolio' }, { status: 500 });
  }
}

// DELETE - Delete a portfolio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Portfolio ID required' }, { status: 400 });
    }

    const { error } = await supabase.from('portfolios').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete portfolio error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete portfolio' }, { status: 500 });
  }
}
