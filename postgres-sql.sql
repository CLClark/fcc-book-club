/*Tables*/
-- Table: public.books
-- DROP TABLE public.books;

CREATE TABLE public.books
(
    title text COLLATE pg_catalog."default",
    isbn13 text COLLATE pg_catalog."default" NOT NULL,
    pages text COLLATE pg_catalog."default",
    image_url text COLLATE pg_catalog."default",
    language text COLLATE pg_catalog."default",
    url text COLLATE pg_catalog."default",
    active boolean DEFAULT true,
    tsv tsvector,
    publisheddate text COLLATE pg_catalog."default" DEFAULT 'unknown'::text,
    volume text COLLATE pg_catalog."default" NOT NULL DEFAULT (gen_random_uuid())::text,
    authors text[] COLLATE pg_catalog."default" NOT NULL DEFAULT '{None}'::text[],
    CONSTRAINT vol_pkey PRIMARY KEY (volume)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.books
    OWNER to /*{yourDBUserName}*/;

-- Trigger: tsvectorupdate 

-- DROP TRIGGER "tsvectorupdate " ON public.books;

CREATE TRIGGER "tsvectorupdate "
    BEFORE INSERT OR UPDATE 
    ON public.books
    FOR EACH ROW
    EXECUTE PROCEDURE public.tsv_trigger();

/*************/
-- Table: public.ownership

-- DROP TABLE public.ownership;

CREATE TABLE public.ownership
(
    owner text COLLATE pg_catalog."default" NOT NULL,
    bookid text COLLATE pg_catalog."default" NOT NULL,
    date_added text COLLATE pg_catalog."default",
    date_removed text COLLATE pg_catalog."default",
    active boolean,
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    tradeable boolean NOT NULL DEFAULT true,
    CONSTRAINT ownership_pkey PRIMARY KEY (id),
    CONSTRAINT owned_book FOREIGN KEY (bookid)
        REFERENCES public.books (volume) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT owner FOREIGN KEY (owner)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.ownership
    OWNER to /*{yourDBUserName}*/;

COMMENT ON CONSTRAINT owner ON public.ownership
    IS 'user''s id';

-- Trigger: cancelAnyTrades

-- DROP TRIGGER "cancelAnyTrades" ON public.ownership;

CREATE TRIGGER "cancelAnyTrades"
    AFTER UPDATE OF active
    ON public.ownership
    FOR EACH ROW
    WHEN ((new.active = false))
    EXECUTE PROCEDURE public."tradesCancel"();

/*************/
-- Table: public.session

-- DROP TABLE public.session;

CREATE TABLE public.session
(
    sid character varying COLLATE pg_catalog."default" NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.session
    OWNER to /*{yourDBUserName}*/;

/*************/
-- Table: public.trades

-- DROP TABLE public.trades;

CREATE TABLE public.trades
(
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    proposer text COLLATE pg_catalog."default",
    receiver text COLLATE pg_catalog."default",
    status text COLLATE pg_catalog."default" DEFAULT 'created'::text,
    active boolean NOT NULL DEFAULT true,
    date_proposed timestamp with time zone,
    date_responded timestamp with time zone,
    paired_trade uuid,
    pro_ownership uuid,
    rec_ownership uuid,
    CONSTRAINT trades_pkey PRIMARY KEY (id),
    CONSTRAINT linked_trade FOREIGN KEY (paired_trade)
        REFERENCES public.trades (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT proposer FOREIGN KEY (proposer)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT proposers_own_record FOREIGN KEY (pro_ownership)
        REFERENCES public.ownership (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT receiver FOREIGN KEY (receiver)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT receivers_own_record FOREIGN KEY (rec_ownership)
        REFERENCES public.ownership (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.trades
    OWNER to /*{yourDBUserName}*/;

COMMENT ON COLUMN public.trades.date_proposed
    IS 'date the trade was requested';

COMMENT ON COLUMN public.trades.date_responded
    IS 'when the receiver responds to trade';

COMMENT ON COLUMN public.trades.paired_trade
    IS 'the trades record to link to this trade';

COMMENT ON CONSTRAINT proposer ON public.trades
    IS 'id of trade proposer';

/*************/
-- Table: public.users

-- DROP TABLE public.users;

CREATE TABLE public.users
(
    id text COLLATE pg_catalog."default" NOT NULL,
    "displayName" text COLLATE pg_catalog."default",
    gender text COLLATE pg_catalog."default",
    locations text[] COLLATE pg_catalog."default",
    ownership text[] COLLATE pg_catalog."default",
    city text COLLATE pg_catalog."default",
    state text COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to /*{yourDBUserName}*/;
    
/*Trigger functions*/

/****
"tradesCancel"
To cancel pending trades when a book ownership is removed
******/

BEGIN
  UPDATE trades
  set status = 'CANCELED'  
  WHERE pro_ownership = NEW.id OR rec_ownership = NEW.id;
  RETURN NEW;
END;

/****
"tsv_trigger"
To handle search functionality.
******/

BEGIN
	new.tsv :=
		to_tsvector('pg_catalog.english', coalesce(new.title,'')) ||
	      	to_tsvector('pg_catalog.english', coalesce(new.isbn13,'')) ||
		to_tsvector('pg_catalog.english', coalesce(array_to_string(new.authors,' '),''));
	return new;
END
