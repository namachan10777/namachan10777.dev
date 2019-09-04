port module Main exposing (Model)

import Browser
import Browser.Events
import Html exposing (..)
import Html.Attributes exposing (class, href, id, src)
import Html.Events exposing (..)
import Json.Decode as Decode
import Os
import Task
import Time
import Types exposing (KeyValue)
import Util


main : Program () Model Msg
main =
    Browser.element { init = init, update = update, view = view, subscriptions = subscriptions }



-- MODEL


type alias Model =
    { current : String
    , hists : List ( String, Os.CmdResult )
    , posix : Time.Posix
    , zone : Time.Zone
    , system : Os.System
    , candidates : List String
    }


type Msg
    = Type KeyValue
    | ScrollBottom
    | SetSystemTime ( Time.Zone, Time.Posix )
    | SetCurrentTime Time.Posix


setSystemTime : Cmd Msg
setSystemTime =
    Task.perform SetSystemTime <| Task.map2 Tuple.pair Time.here Time.now


init : () -> ( Model, Cmd Msg )
init _ =
    ( { current = "help"
      , hists = []
      , posix = Time.millisToPosix 0
      , zone = Time.utc
      , system = Os.initialSystem
      , candidates = Os.enumerateCmds Os.initialSystem
      }
    , setSystemTime
    )



-- UTIL


type TypingStatus
    = Complete String
    | Yet ( String, String )
    | Invalid String
    | NoInput


complete : List String -> String -> Maybe String
complete candidates current =
    let
        currentLen =
            String.length current
    in
    candidates |> List.filter (\candidate -> current == String.left currentLen candidate) |> List.head


analyzeCurrent : List String -> String -> TypingStatus
analyzeCurrent candidates current =
    if current == "" then
        NoInput

    else if candidates |> List.any (\candidate -> candidate == current) then
        Complete current

    else
        let
            currentLen =
                String.length current
        in
        case complete candidates current of
            Just candidate ->
                Yet ( current, String.right (String.length candidate - currentLen) candidate )

            Nothing ->
                Invalid current



-- UPDATE


port scrollBottom : () -> Cmd msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Type (Types.Character c) ->
            ( { model | current = model.current ++ String.fromChar c }, Cmd.none )

        Type (Types.Control "Enter") ->
            let
                ( execResult, newSystem ) =
                    case String.split " " model.current of
                        cmd :: args ->
                            Os.exec model.system cmd args

                        _ ->
                            ( Os.NoCmd, model.system )
            in
            case execResult of
                Os.Clear ->
                    ( { model
                        | current = ""
                        , hists = [ ( model.current, Os.Clear ) ]
                        , candidates = Os.enumerateCmds newSystem
                        , system = newSystem
                      }
                    , scrollBottom ()
                    )

                other ->
                    ( { model
                        | current = ""
                        , hists = ( model.current, other ) :: model.hists
                        , candidates = Os.enumerateCmds newSystem
                        , system = newSystem
                      }
                    , scrollBottom ()
                    )

        Type (Types.Control "Backspace") ->
            ( { model | current = String.left (String.length model.current - 1) model.current }, Cmd.none )

        Type (Types.Control "ArrowRight") ->
            case complete model.candidates model.current of
                Just completed ->
                    ( { model | current = completed }, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )

        Type (Types.Control _) ->
            ( model, Cmd.none )

        ScrollBottom ->
            ( model, scrollBottom () )

        SetSystemTime ( zone, time ) ->
            ( { model | posix = time, zone = zone }, Cmd.none )

        SetCurrentTime time ->
            ( { model | posix = time }, Cmd.none )



-- VIEW


renderPrompt =
    span [] [ span [ class "arrow" ] [ text "×> " ], span [ class "dir" ] [ text "~/ " ] ]


renderCurrent candidates current =
    case analyzeCurrent candidates current of
        NoInput ->
            span [] []

        Invalid typed ->
            span [ class "error" ] [ text typed ]

        Yet ( typed, yet ) ->
            span [] [ span [ class "error" ] [ text typed ], span [ class "yet" ] [ text yet ] ]

        Complete typed ->
            span [ class "complete" ] [ text typed ]


toEnMonth month =
    case month of
        Time.Jan ->
            "Jan"

        Time.Feb ->
            "Feb"

        Time.Mar ->
            "Mar"

        Time.Apr ->
            "Apr"

        Time.May ->
            "May"

        Time.Jun ->
            "Jun"

        Time.Jul ->
            "Jul"

        Time.Aug ->
            "Aug"

        Time.Sep ->
            "Sep"

        Time.Oct ->
            "Oct"

        Time.Nov ->
            "Nov"

        Time.Dec ->
            "Dec"


renderPowerline model =
    let
        year =
            Time.toYear model.zone model.posix |> String.fromInt

        month =
            Time.toMonth model.zone model.posix |> toEnMonth

        day =
            Time.toDay model.zone model.posix |> String.fromInt

        hour =
            Time.toHour model.zone model.posix |> String.fromInt

        minute =
            Time.toMinute model.zone model.posix |> String.fromInt

        second =
            Time.toSecond model.zone model.posix |> String.fromInt
    in
    footer []
        [ span [ class "terminal-info" ] [ text "fish- 1:namachan10777*" ]
        , span [ class "time" ] [ text (month ++ " " ++ day ++ " " ++ year ++ " " ++ hour ++ ":" ++ minute ++ ":" ++ second) ]
        ]


renderHists hists =
    List.map
        (\hist ->
            case hist of
                ( cmd, Os.Stdout s ) ->
                    div []
                        [ div [ class "complete" ] [ renderPrompt, text cmd ]
                        , div [] [ renderPrompt, text s ]
                        ]

                ( cmd, Os.Icon ) ->
                    div []
                        [ div [ class "complete" ] [ renderPrompt, text cmd ]
                        , img [ src "./res/icon.jpg" ] [ renderPrompt ]
                        , div []
                            [ span [] [ text "by " ]
                            , a [ href "https://twitter.com/hsm_hx" ] [ text "@hsm_hx" ]
                            ]
                        ]

                ( cmd, Os.Clear ) ->
                    div [] [ renderPrompt, span [ class "complete" ] [ text cmd ] ]

                ( cmd, Os.NoCmd ) ->
                    div [] [ renderPrompt, span [ class "error" ] [ text cmd ] ]
        )
        hists


view : Model -> Html Msg
view model =
    let
        lists =
            div [] [ renderPrompt, renderCurrent model.candidates model.current ] :: renderHists model.hists
    in
    div [ id "root" ]
        [ div [ id "scroll-area" ] (List.reverse lists)
        , renderPowerline model
        ]



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.batch
        [ Browser.Events.onKeyDown (Decode.map Type Util.keyDecoder)
        , Time.every 1000 SetCurrentTime
        ]
